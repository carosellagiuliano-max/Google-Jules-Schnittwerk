import { requireRole } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default async function AdminDashboardPage() {
  await requireRole(['owner', 'admin']);

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Willkommen im Admin-Dashboard</CardTitle>
          <CardDescription>
            Wählen Sie einen Bereich aus der Navigation, um ihn zu verwalten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Hier haben Sie die volle Kontrolle über Ihre Salon-Daten.</p>
        </CardContent>
      </Card>
    </div>
  );
}
