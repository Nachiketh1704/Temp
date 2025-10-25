import { Response } from "express";
import { AuthenticatedRequest } from "../../types";
import { JobApplicationService } from "../../services/jobApplication";

export class JobApplicationController {
  private service = new JobApplicationService();

  /**
   * Apply for a job
   */
  applyForJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const data = req.body;

      const application = await this.service.applyForJob(userId, data);

      res.json({
        success: true,
        data: application,
        message: "Application submitted successfully",
      });
    } catch (error: any) {
      console.error("Error applying for job:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to apply for job",
      });
    }
  };

  /**
   * Get job applications (job owner only)
   */
  getJobApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { jobId } = req.params;

      const applications = await this.service.getJobApplications(
        Number(jobId),
        userId,
        req.query
      );

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error("Error fetching job applications:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to fetch applications",
      });
    }
  };

  getApplicationById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;

      const applications = await this.service.getApplicationById(
        Number(applicationId),
        userId
      );

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error("Error fetching job applications:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to fetch applications",
      });
    }
  };
  /**
   * Get user's applications
   */
  getUserApplications = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;

      const applications = await this.service.getUserApplications(userId, {
        ...req.query
      });

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error("Error fetching user applications:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to fetch applications",
      });
    }
  };

  /**
   * Accept an application (job owner only)
   */
  acceptApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;

      const assignment = await this.service.acceptApplication(
        Number(applicationId),
        userId
      );

      res.json({
        success: true,
        data: assignment,
        message: "Application accepted and job assigned",
      });
    } catch (error: any) {
      console.error("Error accepting application:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to accept application",
      });
    }
  };

  /**
   * Reject an application (job owner only)
   */
  rejectApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;
      const { reason } = req.body;

      const application = await this.service.rejectApplication(
        Number(applicationId),
        userId,
        reason
      );

      res.json({
        success: true,
        data: application,
        message: "Application rejected",
      });
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to reject application",
      });
    }
  };

  /**
   * Withdraw application (applicant only)
   */
  withdrawApplication = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { applicationId } = req.params;

      const application = await this.service.withdrawApplication(
        Number(applicationId),
        userId
      );

      res.json({
        success: true,
        data: application,
        message: "Application withdrawn",
      });
    } catch (error: any) {
      console.error("Error withdrawing application:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to withdraw application",
      });
    }
  };
}
