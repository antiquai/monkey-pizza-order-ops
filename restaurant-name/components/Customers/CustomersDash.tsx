import { useEffect, useState } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"

import { AlertComponent } from "./AlertComponents/AlertComponentDeleting";
import { DectructiveAlertComponent } from "./AlertComponents/DesctructiveAlertComponentDeleting"

import { Loader2 } from "lucide-react";

import { toast } from "sonner";


export interface Customer {
    cus_id: string;
    cus_name: string;
    cus_phone: string;
    cus_address: string;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_SERVER_IP;

export default function CustomersDash() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false)

    // Operating
    const [isDialogOpened, setIsDialogOpened] = useState(false)
    const [selectedCusId, setSelectedCusId] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true);
        fetch(`${GATEWAY_URL}/customers/load`)
            .then(r => r.json())
            .then((data) => {
                console.log("API response: ", data)
                setCustomers(Array.isArray(data) ? data : data.cus_data ?? []);
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const handleConfirmation = (cus_id: string) => {
        setSelectedCusId(cus_id);
        setIsDialogOpened(true)
    }

    const handleDeleteConfirmed = async () => {
        if (!selectedCusId) return;

        setIsDeleting(true)
        try {
            const res = await fetch(`${GATEWAY_URL}/customers/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cus_id: selectedCusId })
            });

            if (res.ok) {
                setCustomers(prev => prev.filter(c => c.cus_id !== selectedCusId));
                setIsDialogOpened(false);
                setSelectedCusId(null);
                toast.custom((t) => (
                    <div className="w-full flex justify-center">
                      <AlertComponent />
                    </div>
                ))
            }
            else {
                console.log("Failed to delete customer")
                toast.custom((t) => (
                    <div className="w-full flex justify-center">
                      <DectructiveAlertComponent />
                    </div>
                ))                
            }
        } catch (error) {
            console.error("Network error deleting customer: ", error)
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
      return (  
        <div className="flex items-center justify-center w-full h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Loading orders...
            </span>
          </div>
        </div>
      );
    }

    return (
        <div className="relative min-h-[97vh] flex flex-col rounded-2xl m-3 bg-white font-sans overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-black uppercase mb-8 tracking-tighter">Customers</h1>
                <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 font-bold mt-2">List of saved customers</p>

                <div className="border border-zinc-200 rounded-3xl">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((cus_data, index) => (
                                <TableRow key={cus_data.cus_id || index}>
                                    <TableCell className="font-bolt">{cus_data.cus_name}</TableCell>
                                    <TableCell>{cus_data.cus_phone}</TableCell>
                                    <TableCell>{cus_data.cus_address}</TableCell>
                                    <TableCell className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm">Update</Button>
                                        <Button onClick={() => handleConfirmation(cus_data.cus_id)} variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>


                {customers.length === 0 && (
                    <div className="text-center text-zinc-300 uppercase">
                        No saved customer yet...
                    </div>                
                )}
            </div>

            <Dialog open={isDialogOpened} onOpenChange={setIsDialogOpened}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-black uppercase tracking-tight text-xl">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-sm">
                            Are you absolutly sure you want to delete this customer? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpened(false)} disabled={isDeleting} className="font-bold uppercase text-xs tracking-wider">Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={isDeleting} className="font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                            {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}