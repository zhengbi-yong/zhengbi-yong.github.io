import { faker } from '@faker-js/faker'

export interface MockAuthUser {
  id: string
  username: string
  email: string
  password: string
  role: 'user' | 'admin' | 'moderator'
  profile: {
    avatar: string | null
    bio: string | null
    location: string | null
    website: string | null
  } | null
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface MockAuthUserOptions {
  id?: string
  username?: string
  email?: string
  password?: string
  role?: 'user' | 'admin' | 'moderator'
  emailVerified?: boolean
}

export function createMockAuthUser(options: MockAuthUserOptions = {}): MockAuthUser {
  const createdAt = faker.date.past({ years: 2 })
  const includeProfile = faker.datatype.boolean({ probability: 0.3 })

  return {
    id: options.id || faker.string.uuid(),
    username: options.username || faker.internet.username(),
    email: options.email || faker.internet.email(),
    password: options.password || faker.internet.password({ length: 12 }),
    role: options.role || 'user',
    email_verified: options.emailVerified ?? faker.datatype.boolean({ probability: 0.3 }),
    created_at: createdAt.toISOString(),
    updated_at: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
    profile: includeProfile
      ? {
          avatar: faker.datatype.boolean() ? faker.image.avatar() : null,
          bio: faker.lorem.sentence({ min: 5, max: 20 }),
          location: `${faker.location.city()}, ${faker.location.countryCode('alpha-2')}`,
          website: faker.datatype.boolean() ? faker.internet.url() : null,
        }
      : null,
  }
}

export function createMockAuthToken(): string {
  return faker.string.alphanumeric({ length: 64 })
}
