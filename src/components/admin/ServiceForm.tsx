'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Service } from '@prisma/client';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const serviceFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  duration: z.coerce.number().int().positive({
    message: 'Duration must be a positive number.',
  }),
  price: z.coerce.number().int().min(0, {
    message: 'Price cannot be negative.',
  }),
  active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  service?: Service;
  onClose: () => void;
}

export function ServiceForm({ service, onClose }: ServiceFormProps) {
  const router = useRouter();
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name || '',
      duration: service?.duration || 30,
      price: service?.price || 0,
      active: service?.active ?? true,
    },
  });

  const onSubmit = async (data: ServiceFormValues) => {
    const method = service ? 'PUT' : 'POST';
    const url = service
      ? `/api/admin/services/${service.id}`
      : '/api/admin/services';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${service ? 'update' : 'create'} service`);
      }

      toast.success(
        `Dienstleistung ${service ? 'erfolgreich aktualisiert' : 'erfolgreich erstellt'}.`
      );
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Ein Fehler ist aufgetreten.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="z.B. Herrenhaarschnitt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dauer (in Minuten)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preis (in Rappen/Cent)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                Geben Sie den Preis in der kleinsten Währungseinheit an (z.B. 5000 für 50.00 CHF).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Aktiv</FormLabel>
                <FormDescription>
                  Macht die Dienstleistung für Kunden buchbar.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
