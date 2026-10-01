export interface UserProfileDto {
  fullName: string;
  identityNumber?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  permanentAddress?: string | null;
  temporaryAddress?: string | null;
}

export interface ProfileInput {
  fullName: string;
  identityNumber?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  permanentAddress?: string | null;
  temporaryAddress?: string | null;
}
