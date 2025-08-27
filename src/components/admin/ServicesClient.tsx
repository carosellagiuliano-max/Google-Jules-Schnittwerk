'use client';

import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Service } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ServiceForm } from './ServiceForm';

interface ServicesClientProps {
  services: Service[];
}

export function ServicesClient({ services }: ServicesClientProps) {
  const router = useRouter();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2);
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
  };

  const handleCloseEditDialog = () => {
    setEditingService(null);
  };

  const handleDeleteClick = (service: Service) => {
    setDeletingService(service);
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;

    try {
      const response = await fetch(`/api/admin/services/${deletingService.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      toast.success('Dienstleistung erfolgreich gelöscht.');
      router.refresh();
      setDeletingService(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Ein Fehler ist aufgetreten.');
      setDeletingService(null);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dienstleistungen</CardTitle>
              <CardDescription>
                Verwalten Sie hier Ihre Dienstleistungen.
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Neue Dienstleistung
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Dienstleistung erstellen</DialogTitle>
                </DialogHeader>
                <ServiceForm onClose={() => setAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Dauer (Min)</TableHead>
                  <TableHead className="text-right">Preis (CHF)</TableHead>
                  <TableHead>
                    <span className="sr-only">Aktionen</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <Badge variant={service.active ? 'default' : 'secondary'}>
                        {service.active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-right">{service.duration}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(service.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(service)}>
                        Bearbeiten
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(service)}>
                        Löschen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Keine Dienstleistungen gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Service Dialog */}
        <Dialog open={!!editingService} onOpenChange={(open) => !open && handleCloseEditDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dienstleistung bearbeiten</DialogTitle>
            </DialogHeader>
            {editingService && (
              <ServiceForm
                service={editingService}
                onClose={handleCloseEditDialog}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingService} onOpenChange={(open) => !open && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Dies wird die
              Dienstleistung &quot;{deletingService?.name}&quot; dauerhaft löschen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingService(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
