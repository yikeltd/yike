export type EvidenceType =
  | "photo"
  | "video"
  | "inspection_report"
  | "legal_contract"
  | "title_deed"
  | "audio";

export type HashStatus =
  | "VERIFIED_INTACT"
  | "TAMPERED_HASH_MISMATCH"
  | "PENDING_VERIFICATION";

export type ExifMetadata = {
  latitude: number;
  longitude: number;
  altitude?: number;
  deviceModel: string;
  capturedAt: string;
};

export type EvidenceItem = {
  id: string;
  passportId: string;
  partnerId: string;
  type: EvidenceType;
  title: string;
  s3UriPrimary: string;
  s3UriBackup: string;
  sha256Hash: string;
  hashStatus: HashStatus;
  exif?: ExifMetadata;
  version: number;
  createdAt: string;
};

export type CourtReadyPackage = {
  packageId: string;
  passportId: string;
  manifestSha256: string;
  generatedAt: string;
  totalItems: number;
  chainOfCustody: string[];
  verifiedByLawyer: boolean;
};
