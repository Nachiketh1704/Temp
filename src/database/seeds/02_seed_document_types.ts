import type { Knex } from "knex";
import { CommonDocumentTypes } from "../../constants/enum";

export async function seed(knex: Knex): Promise<void> {
  console.log("🌱 Seeding all document types...");

  const documentTypes = [
    // Driver-related
    { name: CommonDocumentTypes.DRIVER_LICENSE, displayName: "Driver License", description: "Driver's license or permit", requiresExpiry: true },
    { name: CommonDocumentTypes.VEHICLE_REGISTRATION, displayName: "Vehicle Registration", description: "Vehicle registration certificate", requiresExpiry: true },
    { name: CommonDocumentTypes.INSURANCE, displayName: "Insurance", description: "Vehicle insurance certificate", requiresExpiry: true },
    { name: CommonDocumentTypes.CDL, displayName: "CDL", description: "Commercial Driver License", requiresExpiry: true },
    { name: CommonDocumentTypes.MEDICAL_CARD, displayName: "Medical Card", description: "Medical examiner's certificate", requiresExpiry: true },
    { name: CommonDocumentTypes.HAZMAT_ENDORSEMENT, displayName: "Hazmat Endorsement", description: "Hazardous materials endorsement", requiresExpiry: true },
    { name: CommonDocumentTypes.TWIC_CARD, displayName: "TWIC Card", description: "Transportation Worker Identification Credential", requiresExpiry: true },
    { name: CommonDocumentTypes.PASSPORT, displayName: "Passport", description: "Passport for international travel", requiresExpiry: true },
    { name: CommonDocumentTypes.ID_CARD, displayName: "ID Card", description: "Government-issued identification card", requiresExpiry: true },

    // Company-related
    { name: CommonDocumentTypes.BUSINESS_LICENSE, displayName: "Business License", description: "Business operating license", requiresExpiry: true },
    { name: CommonDocumentTypes.TAX_DOCUMENT, displayName: "Tax Document", description: "Tax identification or tax clearance", requiresExpiry: false },
    { name: CommonDocumentTypes.BANK_STATEMENT, displayName: "Bank Statement", description: "Bank account statement for verification", requiresExpiry: false },
    { name: CommonDocumentTypes.ADDRESS_PROOF, displayName: "Address Proof", description: "Proof of address (utility bill, lease agreement)", requiresExpiry: false },

    // Broker-specific
    { name: CommonDocumentTypes.BROKER_LICENSE, displayName: "Broker License", description: "Broker license", requiresExpiry: true },

    // Carrier-specific
    { name: CommonDocumentTypes.CARGO_INSURANCE, displayName: "Cargo Insurance", description: "Cargo insurance", requiresExpiry: true },
    { name: CommonDocumentTypes.FUEL_TAX_EXEMPTION, displayName: "Fuel Tax Exemption", description: "Fuel tax exemption", requiresExpiry: true },

    // Shipper-specific
    { name: CommonDocumentTypes.SHIPPER_REGISTRATION, displayName: "Shipper Registration", description: "Shipper registration", requiresExpiry: true },
    { name: CommonDocumentTypes.DELIVERY_TERMS, displayName: "Delivery Terms", description: "Delivery terms agreement", requiresExpiry: false },
  ];

  // Insert document types
  for (const docType of documentTypes) {
    await knex("documentTypes")
      .insert({
        ...docType,
        createdAt: new Date().toISOString(),
      })
      .onConflict()
      .ignore();
  }

  console.log("✅ Document types seeded successfully!");

  // Fetch roles + docs
  const insertedDocTypes = await knex("documentTypes").select("*");
  const roles = await knex("roles").select("*");

  console.log("🔗 Assigning document type requirements to roles...");

  // Helper fn
  async function assignDocsToRole(roleKeyword: string, docNames: string[]) {
    const role = roles.find((r) =>
      r.name.toLowerCase().includes(roleKeyword.toLowerCase())
    );
    if (!role) return;

    for (let i = 0; i < docNames.length; i++) {
      const docType = insertedDocTypes.find((dt) => dt.name === docNames[i]);
      if (docType) {
        await knex("documentTypeRoleRequirements")
          .insert({
            documentTypeId: docType.id,
            roleId: role.id,
            sortOrder: i,
          })
          .onConflict()
          .ignore();
      }
    }
    console.log(`✅ Assigned docs to ${role.name}`);
  }

  // Assign to roles
  await assignDocsToRole("driver", [
    CommonDocumentTypes.DRIVER_LICENSE,
    CommonDocumentTypes.CDL,
    CommonDocumentTypes.MEDICAL_CARD,
    CommonDocumentTypes.VEHICLE_REGISTRATION,
    CommonDocumentTypes.INSURANCE,
  ]);

  await assignDocsToRole("company", [
    CommonDocumentTypes.BUSINESS_LICENSE,
    CommonDocumentTypes.TAX_DOCUMENT,
    CommonDocumentTypes.BANK_STATEMENT,
    CommonDocumentTypes.ADDRESS_PROOF,
  ]);

  await assignDocsToRole("broker", [
    CommonDocumentTypes.BROKER_LICENSE,
    CommonDocumentTypes.TAX_DOCUMENT,
    CommonDocumentTypes.BANK_STATEMENT,
  ]);

  await assignDocsToRole("carrier", [
    CommonDocumentTypes.DRIVER_LICENSE,
    CommonDocumentTypes.CDL,
    CommonDocumentTypes.MEDICAL_CARD,
    CommonDocumentTypes.VEHICLE_REGISTRATION,
    CommonDocumentTypes.INSURANCE,
    CommonDocumentTypes.CARGO_INSURANCE,
    CommonDocumentTypes.FUEL_TAX_EXEMPTION,
  ]);

  await assignDocsToRole("shipper", [
    CommonDocumentTypes.SHIPPER_REGISTRATION,
    CommonDocumentTypes.DELIVERY_TERMS,
  ]);

  console.log("🎉 All document type role requirements assigned successfully!");
}
