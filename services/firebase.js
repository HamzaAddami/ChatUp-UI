import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyAT4Gk2jtdwBpCmQeculd5eGqrtV2QEzTE",
  authDomain: "chatup-b1735.firebaseapp.com",
  projectId: "chatup-b1735",
  storageBucket: "chatup-b1735.firebasestorage.app",
  messagingSenderId: "504752010744",
  appId: "1:504752010744:web:dad49c1b9fc64a3574920d",
  measurementId: "G-4D7DFH2BZ4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };