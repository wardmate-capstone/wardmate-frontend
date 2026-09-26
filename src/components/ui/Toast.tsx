import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';
export { toast } from 'sonner';
export function Toaster(props: ToasterProps) {
  return <SonnerToaster position="bottom-center" richColors closeButton duration={5000} {...props} />;
}
