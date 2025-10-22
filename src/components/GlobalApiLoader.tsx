import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {useRecoilState} from 'recoil';
import {globalLoadingState} from '../store/atoms';
import {useTheme} from './ThemeProvider';
import {loaderController} from '../utils/loaderController';

const GlobalApiLoader: React.FC = () => {
  const {theme} = useTheme();
  const [isLoading, setIsLoading] = useRecoilState(globalLoadingState);

  // Register the setter with the loader controller
  useEffect(() => {
    loaderController.setLoadingSetter(setIsLoading);
  }, [setIsLoading]);

  if (!isLoading) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isLoading}
      statusBarTranslucent={true}
      onRequestClose={() => {
        // Prevent closing - this is a blocking loader
      }}>
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.7)" />
      <View style={[styles.overlay, {backgroundColor: 'rgba(0, 0, 0, 0.7)'}]}>
        <View
          style={[
            styles.loaderContainer,
            {
              backgroundColor: theme.colors.cardBackground,
              shadowColor: theme.colors.textPrimary,
            },
          ]}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            style={styles.spinner}
          />
          <Text style={[styles.loadingText, {color: theme.colors.textPrimary}]}>
            Processing...
          </Text>
          <Text
            style={[
              styles.loadingSubtext,
              {color: theme.colors.textSecondary},
            ]}>
            Please wait
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default GlobalApiLoader;
