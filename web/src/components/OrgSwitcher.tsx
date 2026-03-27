import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useOrgStore } from '@/store/org'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function OrgSwitcher() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const organizations = useOrgStore((s) => s.organizations)
  const currentOrg = useOrgStore((s) => s.currentOrg)
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg)

  if (!currentOrg) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline"  />}>
        {currentOrg.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('org.switchOrg')}</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => setCurrentOrg(org)}
              className={org.id === currentOrg.id ? 'bg-accent' : ''}
            >
              <span className="truncate">{org.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/orgs')}>
          {t('org.settings')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
