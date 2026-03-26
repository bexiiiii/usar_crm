'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Settings01Icon,
  Building01Icon,
  Notification03Icon,
  LockIcon,
  PaintBoardIcon,
  GlobeIcon,
  Invoice01Icon,
  UserGroupIcon,
} from 'hugeicons-react'

type TabId = 'company' | 'notifications' | 'security' | 'integrations' | 'documents' | 'appearance'

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'company', label: 'Компания', icon: Building01Icon },
  { id: 'notifications', label: 'Уведомления', icon: Notification03Icon },
  { id: 'security', label: 'Безопасность', icon: LockIcon },
  { id: 'integrations', label: 'Интеграции', icon: GlobeIcon },
  { id: 'documents', label: 'Документы', icon: Invoice01Icon },
  { id: 'appearance', label: 'Оформление', icon: PaintBoardIcon },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{ background: checked ? '#2B5BF0' : '#CBD5E1' }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ left: checked ? '22px' : '4px' }}
      />
    </button>
  )
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F4' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: '#E2E8F4' }}>
        <h3 className="text-sm font-bold" style={{ color: '#1A2332' }}>{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: '#1A2332' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: '#6B7A9A' }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        style={{ borderColor: '#E2E8F4' }}
      />
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('company')

  // Company state
  const [company, setCompany] = useState({
    name: 'Usar Travel Agency',
    legalName: 'ТОО «Usar Travel»',
    bin: '',
    phone: '+7 (777) 000-00-00',
    email: 'info@usartravel.kz',
    address: 'г. Алматы, ул. Абая, 1',
    website: 'https://usartravel.kz',
    currency: 'KZT',
    timezone: 'Asia/Almaty',
    language: 'ru',
    workStart: '09:00',
    workEnd: '18:00',
  })

  // Notifications state
  const [notif, setNotif] = useState({
    emailNewBooking: true,
    emailPaymentDue: true,
    emailClientBirthday: true,
    emailLeadAssigned: true,
    smsNewBooking: false,
    smsPaymentReminder: true,
    telegramBotEnabled: false,
    overdueAlerts: true,
    departureDays: '3',
    paymentDeadlineDays: '5',
    passportExpireDays: '180',
  })

  // Security state
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '480',
    ipRestriction: false,
    allowedIPs: '',
    passwordMinLength: '8',
    requireSpecialChars: true,
  })

  // Integrations
  const [integrations, setIntegrations] = useState({
    whatsappEnabled: false,
    whatsappToken: '',
    telegramBotToken: '',
    smsProvider: 'none',
    smsApiKey: '',
    emailProvider: 'smtp',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    googleCalendarSync: false,
    stripeKey: '',
    kaspiKey: '',
  })

  // Document settings
  const [docs, setDocs] = useState({
    companyLogo: '',
    contractHeader: 'Настоящий договор заключён между:',
    contractFooter: '',
    voucherHeader: '',
    invoicePrefix: 'INV',
    invoiceStartNumber: '1001',
    taxPercent: '12',
    showTax: true,
  })

  // Appearance
  const [appearance, setAppearance] = useState({
    primaryColor: '#2B5BF0',
    accentColor: '#22C55E',
    companyName: 'Usar Travel CRM',
    sidebarDark: true,
    compactMode: false,
    showAvatars: true,
  })

  function handleSave() {
    toast.success('Настройки сохранены')
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2B5BF0' }}>
            <Settings01Icon size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1A2332' }}>Настройки</h1>
            <p className="text-xs" style={{ color: '#6B7A9A' }}>Управление системными настройками</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: '#2B5BF0' }}
        >
          Сохранить изменения
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Tabs sidebar */}
        <div className="xl:col-span-1 bg-white rounded-2xl p-3 h-fit" style={{ border: '1px solid #E2E8F4' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all"
                style={{
                  background: active ? '#EEF0F8' : 'transparent',
                  color: active ? '#2B5BF0' : '#6B7A9A',
                }}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="xl:col-span-4 space-y-4">
          {activeTab === 'company' && (
            <>
              <SectionBlock title="Информация о компании">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Название компании" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
                  <InputField label="Юридическое название" value={company.legalName} onChange={(v) => setCompany({ ...company, legalName: v })} />
                  <InputField label="БИН/ИНН" value={company.bin} onChange={(v) => setCompany({ ...company, bin: v })} placeholder="000000000000" />
                  <InputField label="Телефон" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
                  <InputField label="Email" type="email" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
                  <InputField label="Сайт" value={company.website} onChange={(v) => setCompany({ ...company, website: v })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Адрес</label>
                  <textarea
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    rows={2}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                    style={{ borderColor: '#E2E8F4' }}
                  />
                </div>
              </SectionBlock>

              <SectionBlock title="Региональные настройки">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Основная валюта</label>
                    <select value={company.currency} onChange={(e) => setCompany({ ...company, currency: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white" style={{ borderColor: '#E2E8F4' }}>
                      <option value="USD">USD — Доллар США</option>
                      <option value="EUR">EUR — Евро</option>
                      <option value="KZT">KZT — Казахстанский тенге</option>
                      <option value="RUB">RUB — Российский рубль</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Часовой пояс</label>
                    <select value={company.timezone} onChange={(e) => setCompany({ ...company, timezone: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white" style={{ borderColor: '#E2E8F4' }}>
                      <option value="Asia/Almaty">Asia/Almaty (UTC+5)</option>
                      <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                      <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                      <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                    </select>
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock title="Рабочие часы">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Начало рабочего дня</label>
                    <input type="time" value={company.workStart} onChange={(e) => setCompany({ ...company, workStart: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: '#E2E8F4' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Конец рабочего дня</label>
                    <input type="time" value={company.workEnd} onChange={(e) => setCompany({ ...company, workEnd: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: '#E2E8F4' }} />
                  </div>
                </div>
              </SectionBlock>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <SectionBlock title="Email уведомления">
                {[
                  { key: 'emailNewBooking', label: 'Новое бронирование', desc: 'При создании нового бронирования' },
                  { key: 'emailPaymentDue', label: 'Дедлайн оплаты', desc: 'Напоминание о сроке оплаты туроператору' },
                  { key: 'emailClientBirthday', label: 'День рождения клиента', desc: 'Автоматическое поздравление' },
                  { key: 'emailLeadAssigned', label: 'Новый лид назначен', desc: 'При назначении лида менеджеру' },
                ].map((item) => (
                  <SettingRow key={item.key} label={item.label} description={item.desc}>
                    <Toggle
                      checked={notif[item.key as keyof typeof notif] as boolean}
                      onChange={(v) => setNotif({ ...notif, [item.key]: v })}
                    />
                  </SettingRow>
                ))}
              </SectionBlock>

              <SectionBlock title="SMS уведомления">
                {[
                  { key: 'smsNewBooking', label: 'Новое бронирование', desc: 'SMS клиенту при создании брони' },
                  { key: 'smsPaymentReminder', label: 'Напоминание об оплате', desc: 'SMS клиенту за 3 дня до дедлайна' },
                ].map((item) => (
                  <SettingRow key={item.key} label={item.label} description={item.desc}>
                    <Toggle
                      checked={notif[item.key as keyof typeof notif] as boolean}
                      onChange={(v) => setNotif({ ...notif, [item.key]: v })}
                    />
                  </SettingRow>
                ))}
              </SectionBlock>

              <SectionBlock title="Напоминания (дней заранее)">
                <div className="grid grid-cols-3 gap-4">
                  <InputField label="До вылета (дней)" type="number" value={notif.departureDays} onChange={(v) => setNotif({ ...notif, departureDays: v })} />
                  <InputField label="До оплаты (дней)" type="number" value={notif.paymentDeadlineDays} onChange={(v) => setNotif({ ...notif, paymentDeadlineDays: v })} />
                  <InputField label="До истечения паспорта (дней)" type="number" value={notif.passportExpireDays} onChange={(v) => setNotif({ ...notif, passportExpireDays: v })} />
                </div>
              </SectionBlock>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <SectionBlock title="Аутентификация">
                <SettingRow label="Двухфакторная аутентификация (2FA)" description="Дополнительная защита аккаунтов">
                  <Toggle checked={security.twoFactor} onChange={(v) => setSecurity({ ...security, twoFactor: v })} />
                </SettingRow>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Таймаут сессии (минут)</label>
                  <select value={security.sessionTimeout} onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })} className="w-full border rounded-xl px-3 py-2 text-sm outline-none bg-white" style={{ borderColor: '#E2E8F4' }}>
                    <option value="60">1 час</option>
                    <option value="240">4 часа</option>
                    <option value="480">8 часов</option>
                    <option value="1440">24 часа</option>
                    <option value="0">Не ограничено</option>
                  </select>
                </div>
              </SectionBlock>

              <SectionBlock title="Ограничение по IP">
                <SettingRow label="Ограничение доступа по IP" description="Разрешить вход только с указанных IP-адресов">
                  <Toggle checked={security.ipRestriction} onChange={(v) => setSecurity({ ...security, ipRestriction: v })} />
                </SettingRow>
                {security.ipRestriction && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Разрешённые IP (каждый с новой строки)</label>
                    <textarea
                      value={security.allowedIPs}
                      onChange={(e) => setSecurity({ ...security, allowedIPs: e.target.value })}
                      rows={4}
                      className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none font-mono"
                      style={{ borderColor: '#E2E8F4' }}
                      placeholder="192.168.1.1&#10;10.0.0.0/24"
                    />
                  </div>
                )}
              </SectionBlock>

              <SectionBlock title="Политика паролей">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Минимальная длина пароля" type="number" value={security.passwordMinLength} onChange={(v) => setSecurity({ ...security, passwordMinLength: v })} />
                </div>
                <SettingRow label="Требовать спецсимволы" description="Пароль должен содержать !@#$%^&*">
                  <Toggle checked={security.requireSpecialChars} onChange={(v) => setSecurity({ ...security, requireSpecialChars: v })} />
                </SettingRow>
              </SectionBlock>
            </>
          )}

          {activeTab === 'integrations' && (
            <>
              <SectionBlock title="WhatsApp Business API">
                <SettingRow label="WhatsApp интеграция" description="Отправка сообщений клиентам через WhatsApp">
                  <Toggle checked={integrations.whatsappEnabled} onChange={(v) => setIntegrations({ ...integrations, whatsappEnabled: v })} />
                </SettingRow>
                {integrations.whatsappEnabled && (
                  <InputField label="API Token" value={integrations.whatsappToken} onChange={(v) => setIntegrations({ ...integrations, whatsappToken: v })} placeholder="Bearer token..." />
                )}
              </SectionBlock>

              <SectionBlock title="Telegram Bot">
                <InputField label="Telegram Bot Token" value={integrations.telegramBotToken} onChange={(v) => setIntegrations({ ...integrations, telegramBotToken: v })} placeholder="1234567890:AAAA..." />
              </SectionBlock>

              <SectionBlock title="Email (SMTP)">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="SMTP Host" value={integrations.smtpHost} onChange={(v) => setIntegrations({ ...integrations, smtpHost: v })} placeholder="smtp.gmail.com" />
                  <InputField label="SMTP Port" value={integrations.smtpPort} onChange={(v) => setIntegrations({ ...integrations, smtpPort: v })} placeholder="587" />
                  <InputField label="Username" value={integrations.smtpUser} onChange={(v) => setIntegrations({ ...integrations, smtpUser: v })} />
                  <InputField label="Password" type="password" value={integrations.smtpPass} onChange={(v) => setIntegrations({ ...integrations, smtpPass: v })} />
                </div>
              </SectionBlock>

              <SectionBlock title="Платёжные системы">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Kaspi Pay API Key" value={integrations.kaspiKey} onChange={(v) => setIntegrations({ ...integrations, kaspiKey: v })} placeholder="pk_..." />
                  <InputField label="Stripe API Key" value={integrations.stripeKey} onChange={(v) => setIntegrations({ ...integrations, stripeKey: v })} placeholder="sk_live_..." />
                </div>
              </SectionBlock>
            </>
          )}

          {activeTab === 'documents' && (
            <>
              <SectionBlock title="Параметры счетов">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Префикс номера счёта" value={docs.invoicePrefix} onChange={(v) => setDocs({ ...docs, invoicePrefix: v })} placeholder="INV" />
                  <InputField label="Начальный номер" type="number" value={docs.invoiceStartNumber} onChange={(v) => setDocs({ ...docs, invoiceStartNumber: v })} />
                  <InputField label="НДС %" type="number" value={docs.taxPercent} onChange={(v) => setDocs({ ...docs, taxPercent: v })} />
                </div>
                <SettingRow label="Показывать НДС в счёте" description="Отдельная строка с суммой НДС">
                  <Toggle checked={docs.showTax} onChange={(v) => setDocs({ ...docs, showTax: v })} />
                </SettingRow>
              </SectionBlock>

              <SectionBlock title="Шаблон договора">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Заголовок договора</label>
                  <textarea
                    value={docs.contractHeader}
                    onChange={(e) => setDocs({ ...docs, contractHeader: e.target.value })}
                    rows={3}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                    style={{ borderColor: '#E2E8F4' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7A9A' }}>Подвал договора</label>
                  <textarea
                    value={docs.contractFooter}
                    onChange={(e) => setDocs({ ...docs, contractFooter: e.target.value })}
                    rows={3}
                    className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                    style={{ borderColor: '#E2E8F4' }}
                    placeholder="Подпись, печать..."
                  />
                </div>
              </SectionBlock>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <SectionBlock title="Цвета интерфейса">
                <SettingRow label="Основной цвет" description="Цвет кнопок, ссылок и активных элементов">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={appearance.primaryColor}
                      onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <span className="text-sm font-mono" style={{ color: '#6B7A9A' }}>{appearance.primaryColor}</span>
                  </div>
                </SettingRow>
                <SettingRow label="Акцентный цвет" description="Цвет успешных статусов">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={appearance.accentColor}
                      onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <span className="text-sm font-mono" style={{ color: '#6B7A9A' }}>{appearance.accentColor}</span>
                  </div>
                </SettingRow>
              </SectionBlock>

              <SectionBlock title="Настройки отображения">
                <SettingRow label="Тёмная боковая панель" description="Тёмный градиент для навигации">
                  <Toggle checked={appearance.sidebarDark} onChange={(v) => setAppearance({ ...appearance, sidebarDark: v })} />
                </SettingRow>
                <SettingRow label="Компактный режим" description="Уменьшенные отступы и шрифты">
                  <Toggle checked={appearance.compactMode} onChange={(v) => setAppearance({ ...appearance, compactMode: v })} />
                </SettingRow>
                <SettingRow label="Аватары пользователей" description="Отображать аватары в списках">
                  <Toggle checked={appearance.showAvatars} onChange={(v) => setAppearance({ ...appearance, showAvatars: v })} />
                </SettingRow>
              </SectionBlock>

              <SectionBlock title="Название системы">
                <InputField label="Название в шапке" value={appearance.companyName} onChange={(v) => setAppearance({ ...appearance, companyName: v })} />
              </SectionBlock>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
