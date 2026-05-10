import { Alert, AlertIcon, AlertTitle, AlertToolbar } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiNotificationFill,
  RiSpam3Fill,
  RiSpamFill,
} from '@remixicon/react';

export function AlertDemo() {
  return (
    <div className="flex flex-col gap-5 p-10 w-full mx-auto max-w-[600px]">
      <Alert variant="primary" close onClose={() => {}}>
        <AlertIcon><RiNotificationFill /></AlertIcon>
        <AlertTitle>This is a primary alert</AlertTitle>
        <AlertToolbar>
          <Button variant="link" size="sm" className="flex mt-0.5">
            Upgrade
          </Button>
        </AlertToolbar>
      </Alert>
      <Alert variant="success" close onClose={() => {}}>
        <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
        <AlertTitle>This is a success alert</AlertTitle>
        <AlertToolbar>
          <Button variant="link" size="sm" className="flex mt-0.5">
            Upgrade
          </Button>
        </AlertToolbar>
      </Alert>
      <Alert variant="destructive" close onClose={() => {}}>
        <AlertIcon><RiErrorWarningFill /></AlertIcon>
        <AlertTitle>This is a destructive alert</AlertTitle>
        <AlertToolbar>
          <Button variant="link" size="sm" className="flex mt-0.5">
            Upgrade
          </Button>
        </AlertToolbar>
      </Alert>
      <Alert variant="info" close onClose={() => {}}>
        <AlertIcon><RiSpamFill /></AlertIcon>
        <AlertTitle>This is an info alert</AlertTitle>
        <AlertToolbar>
          <Button variant="link" size="sm" className="flex mt-0.5">
            Upgrade
          </Button>
        </AlertToolbar>
      </Alert>
      <Alert variant="warning" close onClose={() => {}}>
        <AlertIcon><RiSpam3Fill /></AlertIcon>
        <AlertTitle>This is a warning alert</AlertTitle>
        <AlertToolbar>
          <Button variant="link" size="sm" className="flex mt-0.5">
            Upgrade
          </Button>
        </AlertToolbar>
      </Alert>
    </div>
  );
}
