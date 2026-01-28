import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import client from '../api/client';

interface User {
  id: string;
  alias: string;
  email?: string;
  phoneNumber?: string;
  role: 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN';
  dateOfBirth?: string;
}

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
}

export function UserFormModal({ open, onOpenChange, user, onSuccess }: UserFormModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    alias: '',
    email: '',
    phoneNumber: '',
    pin: '',
    role: 'PATIENT' as 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN',
    dateOfBirth: '',
  });

   const dobIso = formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined;

  useEffect(() => {
    if (user) {
      // Format dateOfBirth for input[type="date"] if it exists
      let formattedDob = '';
      if (user.dateOfBirth) {
        const date = new Date(user.dateOfBirth);
        formattedDob = date.toISOString().split('T')[0];
      }
      
      setFormData({
        alias: user.alias || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        pin: '', // Don't populate PIN for security
        role: user.role || 'PATIENT',
        dateOfBirth: formattedDob,
      });
    } else {
      setFormData({
        alias: '',
        email: '',
        phoneNumber: '',
        pin: '',
        role: 'PATIENT',
        dateOfBirth: '',
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const updateData: any = {
          alias: formData.alias,
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          role: formData.role,
        };
        
        if (formData.dateOfBirth) {
          updateData.dateOfBirth = formData.dateOfBirth;
        }

        // Only include PIN if provided
        if (formData.pin) {
          updateData.pin = formData.pin;
        }

        await client.patch(`/users/${user.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        if (!formData.pin || formData.pin.length !== 4) {
          toast.error('PIN must be 4 digits');
          setLoading(false);
          return;
        }

       

        await client.post('/users', {
          alias: formData.alias,
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          pin: formData.pin,
          role: formData.role,
          dateOfBirth: dobIso,
        });
        toast.success('User created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Update user information. Leave PIN empty to keep current password.'
              : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="alias">Username*</Label>
              <Input
                id="alias"
                value={formData.alias}
                onChange={(e) =>
                  setFormData({ ...formData, alias: e.target.value })
                }
                placeholder="Enter username"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role*</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">Patient</SelectItem>
                  <SelectItem value="PSYCHOLOGIST">Psychologist</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pin">
                PIN (4 digits){user ? ' - Leave empty to keep current' : '*'}
              </Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                value={formData.pin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pin: e.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="Enter 4-digit PIN"
                required={!user}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
