import { JobApplication } from "../../models/jobApplications";
import { Job } from "../../models/job";
import { JobAssignment } from "../../models/jobAssignment";
import { Driver } from "../../models/drivers";
import { User } from "../../models/users";
import { RolePostingPermissionService } from "../rolePostingPermission";
import { Contract } from "../../models/contracts";
import { getSocketInstance, getSocketService } from "../socket/instance";
import { transaction } from "objection";
import { Conversation, ConversationParticipant, Message, SubContract } from "../../models";
import { Logger } from "../../utils/logger";

export interface ApplyForJobData {
  jobId: number;
  coverLetter?: string;
  proposedRate?: number;
  estimatedDuration?: string;
  notes?: string;
}

export class JobApplicationService {
  private rolePermissionService = new RolePostingPermissionService();

  /**
   * Create or get existing conversation for a job and add participants
   * @param trx - Database transaction
   * @param jobId - Job ID
   * @param jobTitle - Job title for conversation naming
   * @param participants - Array of participants to add
   * @param systemMessage - Optional system message content
   * @returns The conversation object
   */
  private async createOrGetJobConversation(args: {
    trx: any;
    jobId: number;
    jobTitle: string;
    participants: Array<{ userId: number; role: string }>;
    systemMessage?: string;
  }): Promise<Conversation> {
    const { trx, jobId, jobTitle, participants, systemMessage } = args;
    // Find root job and get its main conversation
    let conversation = await Conversation.query(trx)
      .where({ jobId })
      .first();

    // If no conversation exists for this job, find root job's conversation
    if (!conversation) {
      const rootJob = await Job.findRootJob(jobId);
      if (rootJob && rootJob.id !== jobId) {
        conversation = await Conversation.query(trx)
          .where({ jobId: rootJob.id })
          .first();
      }
    }

    // If still no conversation, create a new one
    if (!conversation) {
      conversation = await Conversation.query(trx).insertAndFetch({
        jobId,
        chatType: "group",
        title: jobTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Add participants (check if they already exist)
    const existingParticipants = await ConversationParticipant.query(trx)
      .where({ conversationId: conversation.id })
      .whereIn("userId", participants.map(p => p.userId));

    const existingUserIds = existingParticipants.map(p => p.userId);
    const participantsToAdd = participants.filter(p => !existingUserIds.includes(p.userId));

    if (participantsToAdd.length > 0) {
      await ConversationParticipant.query(trx).insert(
        participantsToAdd.map(p => ({
          conversationId: conversation?.id,
          userId: p.userId,
          joinedAt: new Date().toISOString(),
          role: p.role,
        }))
      );
    }

    // Add system message if provided
    if (systemMessage) {
      const sysMsg = await Message.query(trx).insertAndFetch({
        conversationId: conversation.id,
        isSystem: true,
        messageType: "text",
        content: systemMessage,
        createdAt: new Date().toISOString(),
      });

      // Update conversation last message pointers
      await conversation.$query(trx).patch({
        lastMessageId: sysMsg.id,
        lastMessageAt: (sysMsg.createdAt as any)?.toISOString?.() || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return conversation;
  }

  /**
   * Create contract (regular or sub-contract) based on job type
   */
  private async createContractForJob(
    trx: any,
    job: Job,
    application: JobApplication,
    userId: number,
    contractAmount: number
  ): Promise<Contract> {
    const hiredByUserId = job.company?.userId ?? job.userId;

    // Create the contract
    const contract = await Contract.query(trx).insertAndFetch({
      jobId: job.id,
      jobApplicationId: application.id,
      status: "active",
      hiredByUserId,
      hiredUserId: userId,
      amount: contractAmount,
    });

    // If this is a reshared job, create a sub-contract record
    if (job.parentJobId) {
      // Find the contract for the parent job (the job that was reshared)
      const parentJobContract: any = await Contract.query(trx)
        .where({ jobId: job.parentJobId })
        .whereIn("status", ["active", "pending", "onHold"])
        .first();

      if (parentJobContract) {
        // Calculate split percentage (e.g., 70% for reshared job, 30% for original)
        const splitPercentage = 70.0; // Default split - can be made configurable
        const splitAmount = (contract.amount * splitPercentage) / 100;

        // Determine the correct parent and root contract IDs
        // The parent contract is the contract of the job that was reshared
        const parentContractId = parentJobContract.id;
        
        // Find the root contract by traversing up the hierarchy
        let rootContractId = parentJobContract.id;
        if (parentJobContract.parentContractId) {
          // If parent contract has a parent, find the root by traversing up
          let currentContract = parentJobContract;
          let depth = 0;
          const maxDepth = 10; // Prevent infinite loops
          
          while (currentContract.parentContractId && depth < maxDepth) {
            const parentContract = await Contract.query(trx)
              .where({ id: currentContract.parentContractId })
              .first();
            if (parentContract) {
              currentContract = parentContract;
              rootContractId = currentContract.id;
              depth++;
            } else {
              break;
            }
          }
          
          // Log warning if we hit max depth
          if (depth >= maxDepth) {
            console.warn(`Contract hierarchy traversal hit max depth (${maxDepth}) for contract ${parentJobContract.id}. Possible circular reference.`);
          }
        }

        await SubContract.query(trx).insert({
          rootContractId,
          parentContractId,
          subContractId: contract.id,
          resharedJobId: job.id,
          splitPercentage,
          splitAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        Logger.info(`Sub-contract created for job application ${application.id} with ${splitPercentage}% split`);
      }
    }

    return contract;
  }



  /**
   * Apply for a job with auto-assignment logic
   */
  async applyForJob(userId: number, data: ApplyForJobData) {
    const { jobId, coverLetter, proposedRate, estimatedDuration, notes } = data;

    const response = await transaction(JobApplication.knex(), async (trx) => {
      // Lock the job row
      const job = await Job.query(trx)
        .findById(jobId)
        .forUpdate()
        .withGraphFetched(`[company]`);

      if (!job) {
        throw new Error("Job not found");
      }
      if (job.status !== "active") {
        throw new Error("Job is not available for applications");
      }

      // Get user's driver profile
      const driver = await Driver.query(trx).where("userId", userId).first();

      // Check if user already applied
      const existingApplication = await JobApplication.query(trx)
        .where({ jobId, applicantUserId: userId })
        .first();

      if (existingApplication) {
        throw new Error("You have already applied for this job");
      }

      // Create job application
      const application = await JobApplication.query(trx).insertAndFetch({
        jobId,
        applicantUserId: userId, // 👈 add applicant user
        coverLetter,
        proposedRate,
        estimatedDuration,
        notes,
        status: "pending",
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Handle auto-assignment flow
      if (job.assignmentType === "auto") {
        // If a proposedRate is provided and it doesn't match the job's payAmount,
        // do NOT auto-accept. Leave application as pending (bid flow).
        if (
          typeof proposedRate === "number" &&
          Number(proposedRate) !== Number(job.payAmount)
        ) {
          return { application };
        }
        // For short jobs → only one contract allowed
        const existingActiveContract = await Contract.query(trx)
          .where({ jobId })
          .whereIn("status", ["active", "pending"])
          .first();

        if (existingActiveContract) {
          throw new Error("Job already taken");
        }

        // Create a contract (regular or sub-contract)
        const contract = await this.createContractForJob(
          trx,
          job,
          application,
          userId,
          job.payAmount
        );

        // Accept the application first
        await application.$query(trx).patch({
          status: "accepted",
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Create conversation and add participants
        const conversation = await this.createOrGetJobConversation({
          trx,
          jobId: job.id,
          jobTitle: job.title,
          participants: [
            { userId: job?.company?.userId || 0, role: "admin" },
            { userId: userId, role: "member" }
          ],
          systemMessage: `Contract #${contract.id} started for Job "${job.title}"`
        });

        // Link conversation to application
        await application.$query(trx).patch({
          conversationId: conversation.id,
          updatedAt: new Date().toISOString(),
        });

        // Optional applicant note
        let notesMessage: any = null;
        if (application.notes) {
          notesMessage = await Message.query(trx).insertAndFetch({
            conversationId: conversation.id,
            senderUserId: userId,
            isSystem: false,
            messageType: "text",
            content: application.notes,
            createdAt: new Date().toISOString(),
          });
        }

        // Update conversation last message if there's a notes message
        if (notesMessage) {
          await conversation.$query(trx).patch({
            lastMessageId: notesMessage.id,
            lastMessageAt: notesMessage.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Mark job as assigned
        await job.$query(trx).patch({
          status: "assigned",
          updatedAt: new Date().toISOString(),
        });

        // Emit socket event 🚀
        const io = getSocketInstance();
        io.emit("job:assigned", {
          jobId: job.id,
          contractId: contract.id,
          driverId: driver?.id,
          applicantUserId: userId,
        });

        return { application, contract };
      }

      // If manual assignment → only return application
      return { application };
    });
    return response;
  }

  /**
   * Auto-assign job to the first applicant
   */
  private async autoAssignJob(
    job: Job,
    driver: Driver,
    application: JobApplication
  ) {
    // Update application status to accepted
    await JobApplication.query().patchAndFetchById(application.id, {
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create job assignment
    const assignment = await JobAssignment.query().insertAndFetch({
      jobId: job.id,
      driverId: driver.id,
      assignedByCompanyId: job.companyId,
      assignmentType: "auto",
      status: "accepted",
      assignedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update job status
    await Job.query().patchAndFetchById(job.id, {
      status: "assigned",
      assignedDriverId: driver.id,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return assignment;
  }

  /**
   * Get applications for a job (job owner only)
   */
  async getJobApplications(
    jobId: number,
    userId: number,
    filters: { status?: string } = {}
  ) {
    // Verify user owns the job
    const job = await Job.query().where({ id: jobId, userId }).first();

    if (!job) {
      throw new Error("Job not found or access denied");
    }

    return JobApplication.query()
      .where({ jobId })
      .modify((qb) => {
        if (filters?.status) {
          qb.where("status", filters.status);
        }
      })
      .withGraphFetched(
        "[driver.user,applicant, job, contracts.contractParticipants,conversations]"
      )
      .orderBy("appliedAt", "desc");
  }

  async getApplicationById(applicationId: number, userId: number) {
    // Verify user owns the job
    return JobApplication.query()
      .where({ id: applicationId })
      .withGraphFetched(
        "[driver.user, job, contracts.contractParticipants,conversations]"
      )
      .orderBy("appliedAt", "desc");
  }

  /**
   * Get user's applications
   */
  async getUserApplications(userId: number, filters: { status?: string } = {}) {
    const apps = await JobApplication.query()
      .where({ applicantUserId: userId })
      .withGraphFetched(
        "[job.company, job.visibilityRoles.role, contracts.[contractParticipants.user], conversations]"
      )
      .modify((qb) => {
        if (filters?.status) {
          qb.where("status", filters.status);
        }
      })
      .orderBy("appliedAt", "desc");

    return apps;
  }

  /**
   * Accept an application (job owner only)
   */
  async acceptApplication(applicationId: number, userId: number) {
    const response = await transaction(JobApplication.knex(), async (trx) => {
      const application = await JobApplication.query(trx)
        .findById(applicationId)
        .withGraphFetched("[job.company]");

      if (!application) {
        throw new Error("Application not found");
      }

      // Verify user owns the job
      const job = await Job.query(trx)
        .where({ id: application.jobId, userId: userId })
        .withGraphFetched("[company]")
        .first()
        .forUpdate();

      if (!job) {
        throw new Error("Access denied");
      }

      if (job.status !== "active") {
        throw new Error("Job not available for acceptance");
      }

      // if (job.assignmentType === "auto") {
      //   throw new Error("Auto-assignment jobs cannot be manually accepted");
      // }

      // Ensure no active/pending contract exists
      const existingActiveContract = await Contract.query(trx)
        .where({ jobId: job.id })
        .whereIn("status", ["active", "pending"])
        .first();

      if (existingActiveContract) {
        throw new Error("Job already taken");
      }

      // Create contract using proposedRate if provided, otherwise job.payAmount
      const contractAmount = application.proposedRate ||job.payAmount

      // Create a contract (regular or sub-contract)
      const contract = await this.createContractForJob(
        trx,
        job,
        application,
        application.applicantUserId,
        contractAmount
      );

      // Accept the application
      await application.$query(trx).patch({
        status: "accepted",
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create conversation and add participants
      const conversation = await this.createOrGetJobConversation({
        trx,
        jobId: job.id,
        jobTitle: job.title,
        participants: [
          { userId: job?.company?.userId || 0, role: "admin" },
          { userId: application.applicantUserId, role: "member" }
        ],
        systemMessage: `Contract #${contract.id} started for Job "${job.title}"`
      });

      // Link conversation to application
      await application.$query(trx).patch({
        conversationId: conversation.id,
        updatedAt: new Date().toISOString(),
      });



      // Mark job as assigned
      await job.$query(trx).patch({
        status: "assigned",
        updatedAt: new Date().toISOString(),
      });

      // Emit socket event
      const io = getSocketInstance();
      io.emit("job:assigned", {
        jobId: job.id,
        contractId: contract.id,
        driverId: undefined,
        applicantUserId: application.applicantUserId,
      });

      return { application, contract };
    });

    return response;
  }

  /**
   * Reject an application (job owner only)
   */
  async rejectApplication(
    applicationId: number,
    userId: number,
    reason?: string
  ) {
    const response = await transaction(JobApplication.knex(), async (trx) => {
      const application = await JobApplication.query(trx)
        .findById(applicationId)
        .withGraphFetched("[job]");

      if (!application) {
        throw new Error("Application not found");
      }

      // Verify user owns the job
      const job = await Job.query(trx)
        .where({ id: application.jobId, userId: userId })
        .first()
        .forUpdate();

      if (!job) {
        throw new Error("Access denied");
      }

      // Update application status
      const updated = await JobApplication.query(trx).patchAndFetchById(
        applicationId,
        {
          status: "rejected",
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
          updatedAt: new Date().toISOString(),
        }
      );

      return updated;
    });

    return response;
  }

  /**
   * Withdraw application (applicant only)
   */
  async withdrawApplication(applicationId: number, userId: number) {
    const driver = await Driver.query().where("userId", userId).first();

    if (!driver) {
      throw new Error("Driver profile not found");
    }

    const application = await JobApplication.query()
      .where({ id: applicationId, driverId: driver.id })
      .first();

    if (!application) {
      throw new Error("Application not found");
    }

    if (application.status !== "pending") {
      throw new Error("Cannot withdraw accepted or rejected application");
    }

    return JobApplication.query().patchAndFetchById(applicationId, {
      status: "withdrawn",
      withdrawnAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
