import { CheckCircle2Icon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const AlertComponent = () => {
  return (
    <Alert className="max-w-md">
      <CheckCircle2Icon />
      <AlertTitle>Customer was successfully deleted from database!</AlertTitle>
      <AlertDescription>
        Customer was fully removed from database without backup possibility
      </AlertDescription>
    </Alert>
  )
}
