import { AlertCircleIcon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export const DectructiveAlertComponentD = () => {
  return (
    <Alert variant="destructive" className="max-w-md">
      <AlertCircleIcon />
      <AlertTitle>API Error</AlertTitle>
      <AlertDescription>
        Something gone wrong while deleting customer
      </AlertDescription>
    </Alert>
  )
}
