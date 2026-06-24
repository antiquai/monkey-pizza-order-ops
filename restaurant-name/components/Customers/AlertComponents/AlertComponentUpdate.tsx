import { CheckCircle2Icon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const AlertComponentU = () => {
  return (
    <Alert className="max-w-md">
      <CheckCircle2Icon />
      <AlertTitle>Customer data updated!</AlertTitle>
      <AlertDescription>
        Customer data was updated in database
      </AlertDescription>
    </Alert>
  )
}
