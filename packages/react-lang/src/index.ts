// Web entry ("." default export). Auto-mounts the OpenUI devtools widget in
// development via the side-effect import below. React Native resolves the
// "react-native" condition / legacy root field to index.native.ts instead,
// which omits the bootstrap (react-dom is not resolvable under Metro).
import "./devtoolsBootstrap";

export * from "./exports";
