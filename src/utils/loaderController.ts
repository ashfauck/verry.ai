import {SetterOrUpdater} from 'recoil';

// Global loader controller - allows non-React code to control loading state
class LoaderController {
  private setLoading: SetterOrUpdater<boolean> | null = null;

  setLoadingSetter(setter: SetterOrUpdater<boolean>) {
    this.setLoading = setter;
  }

  show() {
    if (this.setLoading) {
      this.setLoading(true);
    }
  }

  hide() {
    if (this.setLoading) {
      this.setLoading(false);
    }
  }
}

export const loaderController = new LoaderController();
