'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Calendar, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserProfileAction } from '@/app/(auth)/actions'

type UserProfileModalProps = {
  isOpen: boolean
  onClose: () => void
}

type UserProfile = {
  id: string
  username: string
  email: string
  created_at: string
  updated_at: string
}

/**
 * User profile modal component
 * Fetches and displays user details from /users/me API
 */
export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchProfile()
    }
  }, [isOpen])

  const fetchProfile = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    const result = await getUserProfileAction()

    if (result.success && result.data) {
      setProfile(result.data)
    } else {
      setError(result.error || 'Failed to load profile')
    }

    setLoading(false)
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View your account information and details
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <div className="py-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <div className="space-y-6 py-4">
            {/* Avatar and Name */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(profile.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-semibold">{profile.username}</h3>
                <p className="text-sm text-muted-foreground">User ID: {profile.id.slice(0, 8)}...</p>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(profile.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(profile.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
