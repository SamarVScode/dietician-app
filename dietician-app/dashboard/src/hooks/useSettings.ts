    import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, addSettingItem, deleteSettingItem } from '../services/settingsService'
import type { SettingCategory, SettingItem } from '../services/settingsService'

export function useSettings(category: SettingCategory): {
  items: SettingItem[]
  isLoading: boolean
  addItem: (name: string) => Promise<void>
  deleteItem: (id: string) => void
  isAdding: boolean
  isDeleting: boolean
} {
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['settings', category],
    queryFn: () => fetchSettings(category),
  })

  const addMutation = useMutation({
    mutationFn: (name: string) => addSettingItem(category, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', category] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSettingItem(category, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', category] })
    },
  })

  return {
    items,
    isLoading,
    addItem: (name: string) => addMutation.mutateAsync(name),
    deleteItem: (id: string) => deleteMutation.mutate(id),
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}