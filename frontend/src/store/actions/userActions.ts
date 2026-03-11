import { UpdateProfileInput } from '@/schemas';

export const UPDATE_PROFILE = 'user/updateProfileRequest';

export const updateProfileRequest = (payload: UpdateProfileInput) => ({
  type: UPDATE_PROFILE,
  payload,
});
