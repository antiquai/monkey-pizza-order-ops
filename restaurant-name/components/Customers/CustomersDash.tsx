import { useEffect, useState, useMemo } from "react";

// shadcn
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Autocomplete
import { AddressAutocomplete } from "../Catalog/AutocompleteComponent";

// Allerts
import { AlertComponentD } from "./AlertComponents/AlertComponentDelete";
import { DectructiveAlertComponentD } from "./AlertComponents/DesctructiveAlertComponentDelete"
import { AlertComponentU } from "./AlertComponents/AlertComponentUpdate";
import { DectructiveAlertComponentU } from "./AlertComponents/DesctructiveAlertComponentUpdate"

// Loader
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
    const [isPatching, setIsPatching] = useState(false)

    // Payload
    const [category, setCategory] = useState<string>("")
    const [info, setInfo] = useState<string>("")

    // Operating
    const [isDelitingDialogOpened, setIsDelitingDialogOpened] = useState(false)
    const [isPatchDialogOpened, setIsPatchDialogOpened] = useState(false)
    const [selectedCusId, setSelectedCusId] = useState<string>("")

    // Search 
    const [searchTerm, setSearchTerm] = useState("")

    const cat = [
        "Name",
        "Phone",
        "Address"
    ]

    useEffect(() => {
        setLoading(true);
        fetch(`${GATEWAY_URL}/customers`)
            .then(r => r.json())
            .then((data) => {
                console.log("API response: ", data)
                setCustomers(Array.isArray(data) ? data : data.cus_data ?? []);
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const filteredCustomers = useMemo(() => {
        const query = searchTerm.toLowerCase().trim()
        if (!query) return customers

        return customers.filter(c => {
            const nameMatch = c.cus_name?.toLowerCase().includes(query)
            const phoneMatch = c.cus_phone?.toLowerCase().includes(query)
            const addressMatch = c.cus_address?.toLowerCase().includes(query)

            return nameMatch || phoneMatch || addressMatch
        })
    }, [searchTerm, customers])


    // Deletion
    const handleConfirmation = (cus_id: string) => {
        setSelectedCusId(cus_id);
        setIsDelitingDialogOpened(true)
    }

    const handleDeleteConfirmed = async (cus_id: string) => {
        if (!selectedCusId) return;

        setIsDeleting(true)
        try {
            const res = await fetch(`${GATEWAY_URL}/customers/${cus_id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setCustomers(prev => prev.filter(c => c.cus_id !== selectedCusId));
                setIsDelitingDialogOpened(false);
                setSelectedCusId(" ");
                toast.custom(() => (
                    <div className="w-full flex justify-center">
                      <AlertComponentD />
                    </div>
                ))
            }
            else {
                console.log("Failed to delete customer")
                toast.custom(() => (
                    <div className="w-full flex justify-center">
                      <DectructiveAlertComponentD />
                    </div>
                ))                
            }
        } catch (error) {
            console.error("Network error deleting customer: ", error)
        } finally {
            setIsDeleting(false)
        }
    }

    // Patching
    const handlePatching = (cus_id: string) => {
        setSelectedCusId(cus_id)
        setInfo("")
        setCategory("")
        setIsPatchDialogOpened(true)
    }

    const handlePatchConfirmed = async (cus_id: string) => {
        if (!selectedCusId) return;

        setIsPatching(true)
        try {
            const res = await fetch(`${GATEWAY_URL}/customers/${cus_id}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    category: category,
                    info: info
                })
            });

            if (res.ok) {
                setCustomers(prev => prev.map(customer => {
                    if (customer.cus_id === selectedCusId){
                        const updateField = category.toLowerCase() === 'name' ? 'cus_name' :
                                            category.toLowerCase() === 'phone' ? 'cus_phone' :
                                            'cus_address'
                        
                        return {
                            ...customer,
                            [updateField]: info
                        }
                    }

                    return customer
                }))
                setIsPatchDialogOpened(false);
                setSelectedCusId("");
                setCategory("")
                setInfo("")

                toast.custom(() => (
                    <div className="w-full flex justify-center">
                      <AlertComponentU />
                    </div>
                ))
            }
            else {
                console.log("Failed to patch the customer")

                toast.custom(() => (
                    <div className="w-full flex justify-center">
                      <DectructiveAlertComponentU />
                    </div>
                ))                
            }
        } catch (error) {
            console.error("Network error patching the customer: ", error)
        } finally {
            setIsPatching(false)
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
                <div className="flex justify-between w-full">
                    <div className="flex-col space-y-2">
                        <h1 className="text-3xl font-black uppercase mb-8 tracking-tighter">Customers</h1>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 font-bold mt-2">List of saved customers</p>
                    </div>
                    <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search a customer..." className="rounded-xl border-zinc-200 h-10 w-1/4 text-sm font-medium"/>
                </div>

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
                            {filteredCustomers.map((cus_data, index) => (
                                <TableRow key={cus_data.cus_id || index}>
                                    <TableCell className="font-bolt">{cus_data.cus_name}</TableCell>
                                    <TableCell>{cus_data.cus_phone}</TableCell>
                                    <TableCell>{cus_data.cus_address}</TableCell>
                                    <TableCell className="flex gap-2 justify-end">
                                        <Button onClick={() => handlePatching(cus_data.cus_id)} variant="outline" size="sm">Update</Button>
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
            
            {/* Delietion */}
            <Dialog open={isDelitingDialogOpened} onOpenChange={setIsDelitingDialogOpened}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-black uppercase tracking-tight text-xl">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-sm">
                            Are you absolutly sure you want to delete this customer? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button variant="outline" onClick={() => setIsDelitingDialogOpened(false)} disabled={isDeleting} className="font-bold uppercase text-xs tracking-wider">Cancel</Button>
                        <Button variant="destructive" onClick={() => handleDeleteConfirmed(selectedCusId)} disabled={isDeleting} className="font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                            {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Patching */}
            <Dialog open={isPatchDialogOpened} onOpenChange={setIsPatchDialogOpened}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-black uppercase tracking-tight text-xl">Edit Customer Data</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-sm">
                            Select category of data and set new information for customer
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup>
                        <Field>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="w-full h-10 rounded-xl border-zinc-200 text-sm font-medium">
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {cat.map(cat => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>                            
                        </Field>
                        <Field>
                            <Label className="font-bold">New Information</Label>
                            {category === "Address" ? (
                                <AddressAutocomplete value={info} onChange={setInfo} placeholder="Start typing address ..." />
                            ):
                                <Input value={info} onChange={e => setInfo(e.target.value)} placeholder={category ? `Enter new ${category.toLowerCase()}...` : "Select category first"} disabled={!category} className="h-10 rounded-xl border-zinc-200 text-sm font-medium" />
                            }
                        </Field>
                    </FieldGroup>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button variant="outline" onClick={() => setIsPatchDialogOpened(false)} disabled={isPatching} className="font-bold uppercase text-xs tracking-wider">Cancel</Button>
                        <Button variant="destructive" onClick={() => handlePatchConfirmed(selectedCusId)} disabled={isPatching} className="font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                            {isPatching && <Loader2 className="w-3 h-3 animate-spin" />}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}