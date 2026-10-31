import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Recommendations: undefined;
  VisitList: undefined;
  Map: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Landing: undefined;
  Details: { edit?: boolean } | undefined;
  Matching: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
