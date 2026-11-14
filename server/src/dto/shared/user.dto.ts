import type { UserSource, PublicUser } from './contracts.js'

export function publicUser(user: UserSource): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username ?? null,
    email: user.email
  }
}
