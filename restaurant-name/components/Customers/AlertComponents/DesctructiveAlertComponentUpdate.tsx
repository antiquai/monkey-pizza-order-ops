import { AlertCircleIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const DectructiveAlertComponentU = () => {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>API Error</AlertTitle>
      <AlertDescription>
        Something gone wrong while updating the customer
      </AlertDescription>
    </Alert>
  )
}
