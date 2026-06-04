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
      <AlertTitle>Order was succesfully sended to kitchen</AlertTitle>
      <AlertDescription>
        All details was sent to the kitchen. Order will be ready soon.Wait for notification sound, thank you for your patience!
      </AlertDescription>
    </Alert>
  )
}
