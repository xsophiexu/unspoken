// The device boundaries every screen test shares: storage is in memory, the safe areas are zero and
// Firebase is never reached (src/firebase.ts is the app's only link to the SDK; feedback.test.tsx
// gives it a fake). Network and timers are mocked per test.
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// Fonts load instantly (no font files are read in tests).
jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), useFonts: () => [true, null] }));
jest.mock('../src/firebase', () => ({ firebaseFeedbackClient: jest.fn() }));
