'use client'

import React, { useContext , useState , useEffect , createContext , ReactNode} from "react";

import {
  createUser,
  signInUser,
  signOutUser,
  getCurrentUser,
  getUserProfile,
  createDemoAccount
} from '@/utils/authUtils';

//it is tsx so define types for better type safety
interface User {
  uid: string;
  email: string;
  displayName?: string;
}
interface UserProfile {
  createdAt: string | number | Date;
  uid: string;
  displayName?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode
}
//authentication context 
const AuthContext = createContext<AuthContextType | undefined>(undefined);

//Custom hook to use the authentication context
export const useAuth = (): AuthContextType=> {
  const context = useContext(AuthContext);
  if(!context){
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
};

//Auth provider component
export const AuthProvider : React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  //Check if user is already authenticated on initial load
  useEffect(() => {
    const checkUserAuth = async () =>{

      //check for the existing user in localstorage

     try {
       // Create demo account if it doesn't exist
       await createDemoAccount();

       const user = getCurrentUser();
       if (user) {
         setCurrentUser(user);
         const profile = await getUserProfile(user.uid);
         setUserProfile(profile);
       }
     } catch (err) {
       console.error("Error checking user auth:", err);
       setError(
         err instanceof Error ? err.message : "Authentication check failed"
       );
     } finally {
       setLoading(false);
     }
    };
    checkUserAuth();
  },[]);

//sign up function

  const signUp = async(email: string, password: string, displayName: string) =>{
    try {
      setLoading(true);
      setError(null);

      const user = await createUser(email , password , displayName);
      setCurrentUser(user);

      //After successful sign up, get and set user profile
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      return user;
    }catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    }
    finally{
      setLoading(false)
    }  
  };

//signIn function 

  const signIn = async(email: string ,password: string) =>{
    try {
      setLoading(true);
      setError(null);

      const user = await signInUser(email, password);
      setCurrentUser(user);

      // After successful signin , get and set user profile
      const profile = getUserProfile(user.uid);
      setUserProfile(profile);

      return user;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false)
    }
  }
//signOut function
const signOut = async (): Promise<void> => {
  try {
    setError(null);
    setLoading(true);

    await signOutUser();
    setCurrentUser(null);
    setUserProfile(null);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Sign out failed";
    setError(errorMessage);
    throw err;
  } finally {
    setLoading(false);
  }
};

//authentication context value 

  const contextValue = {
  currentUser,
  userProfile,
  loading,
  error,
  signUp,
  signOut,
  signIn
  };

return (
  <AuthContext.Provider value={contextValue}>{children}
  </AuthContext.Provider>
)
};

export default AuthContext;