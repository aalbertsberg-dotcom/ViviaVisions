import rawConfig from '../../platform.config.json'

type PlatformConfig = {
  name: string
  shortName: string
  legalName: string
  wordmarkPrimary: string
  wordmarkAccent: string
  tagline: string
  description: string
  creator: {
    name: string
    url: string
    logoPath: string
  }
}

export const platformConfig = rawConfig as PlatformConfig
export const PLATFORM_NAME = platformConfig.name
export const PLATFORM_NAME_UPPER = platformConfig.name.toUpperCase()
export const PLATFORM_SHORT_NAME = platformConfig.shortName
export const PLATFORM_TAGLINE = platformConfig.tagline
export const POWERED_BY_PLATFORM = `Powered by ${PLATFORM_NAME}`
