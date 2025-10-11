import React, { useState, useImperativeHandle, forwardRef } from 'react';
import Snackbar from './Snackbar';

export interface SnackbarControllerHandle {
  show: (message: string, type?: 'error' | 'success' | 'info', duration?: number) => void;
}

const SnackbarController = forwardRef<SnackbarControllerHandle>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'error' | 'success' | 'info'>('info');

  useImperativeHandle(ref, () => ({
    show: (msg: string, t: 'error' | 'success' | 'info' = 'info', duration: number = 3000) => {
      setMessage(msg);
      setType(t);
      setVisible(true);
      setTimeout(() => setVisible(false), duration);
    },
  }));

  return <Snackbar message={message} type={type} visible={visible} />;
});

export default SnackbarController;
