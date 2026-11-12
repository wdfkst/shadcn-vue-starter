<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronsUpDown, LogOut, Settings, UserRound } from 'lucide-vue-next'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import Button from '@/components/ui/button/Button.vue'
import Dialog from '@/components/ui/dialog/Dialog.vue'
import DropdownMenu from '@/components/ui/dropdown-menu/DropdownMenu.vue'
import DropdownMenuItem from '@/components/ui/dropdown-menu/DropdownMenuItem.vue'
import DropdownMenuLabel from '@/components/ui/dropdown-menu/DropdownMenuLabel.vue'
import DropdownMenuSeparator from '@/components/ui/dropdown-menu/DropdownMenuSeparator.vue'
import { useAuth } from '@/stores/auth'
import { readLocal } from '@/lib/access'

const props = defineProps<{ compact?: boolean }>()
const auth = useAuth(),
  router = useRouter(),
  confirmOpen = ref(false)
const name = computed(() => readLocal('admin-profile-name', auth.session?.username ?? ''))
const role = computed(() => (auth.role === 'admin' ? '管理员' : '只读成员'))
const initials = computed(() => (auth.session?.username ?? '?').slice(0, 2).toUpperCase())
const email = computed(() => `${auth.session?.username ?? ''}@example.com`)

function go(path: string) {
  void router.push(path)
}
function logout() {
  confirmOpen.value = false
  auth.logout()
  void router.replace('/login')
}
</script>
<template>
  <DropdownMenu
    :side="compact ? 'bottom' : 'right'"
    align="end"
    class="w-56"
    :trigger-class="compact ? undefined : 'block w-full'"
  >
    <template #trigger>
      <button
        class="flex items-center gap-2 rounded-md text-left hover:bg-sidebar-accent"
        :class="compact ? 'size-8 justify-center' : 'h-12 w-full px-2'"
        :aria-label="compact ? '打开账号菜单' : undefined"
      >
        <Avatar :fallback="initials" class="rounded-lg" />
        <template v-if="!compact">
          <div class="min-w-0 flex-1 text-sm">
            <div class="truncate font-semibold">{{ name }}</div>
            <div class="truncate text-xs text-muted-foreground">{{ role }}</div>
          </div>
          <ChevronsUpDown class="size-4 shrink-0" />
        </template>
      </button>
    </template>
    <DropdownMenuLabel class="font-normal">
      <div class="flex items-center gap-2">
        <Avatar :fallback="initials" class="rounded-lg" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">{{ name }}</div>
          <div class="truncate text-xs text-muted-foreground">{{ email }}</div>
        </div>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem @select="go('/settings')"><UserRound class="size-4" />个人资料</DropdownMenuItem>
    <DropdownMenuItem @select="go('/settings')"><Settings class="size-4" />设置</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" @select="confirmOpen = true"
      ><LogOut class="size-4" />退出登录</DropdownMenuItem
    >
  </DropdownMenu>
  <Dialog
    v-model:open="confirmOpen"
    title="确认退出"
    description="退出后需要重新登录才能访问管理页面。"
    ><div class="flex justify-end gap-2">
      <Button variant="outline" @click="confirmOpen = false">取消</Button
      ><Button variant="destructive" @click="logout">退出登录</Button>
    </div></Dialog
  >
</template>
