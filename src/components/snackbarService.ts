import { useRef } from 'react';

let snackbarRef: any = null;

export const setSnackbarRef = (ref: any) => {
  snackbarRef = ref;
};

export const showSnackbar = (message: string, type: 'error' | 'success' | 'info' = 'info', duration: number = 3000) => {
  if (snackbarRef && snackbarRef.current && typeof snackbarRef.current.show === 'function') {
    snackbarRef.current.show(message, type, duration);
  }
};
