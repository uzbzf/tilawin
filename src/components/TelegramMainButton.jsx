import { MainButton } from '@twa-dev/sdk/react'
import { useTelegram } from '../hooks/useTelegram'
import { useLocale } from '../i18n/LocaleContext'

export function TelegramMainButton() {
  const { isTelegram, openChannel, haptic } = useTelegram()
  const { t } = useLocale()

  if (!isTelegram) return null

  return (
    <MainButton
      text={t('telegram.openChannel')}
      hasShineEffect
      onClick={() => {
        haptic('soft')
        openChannel()
      }}
    />
  )
}
