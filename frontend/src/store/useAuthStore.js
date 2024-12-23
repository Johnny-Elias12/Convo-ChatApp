import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/";

export const useAuthStore = create((set, get)=> ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    isCheckingAuth: true,
    socket: null,


    checkAuth: async() => {
        try {
            const res = await axiosInstance.get("/auth/check");

            set({authUser:res.data});

            // la2an bl app.jsx, bass nfut aal app it checks bl useEffect iza l user authenticated 
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth", error);
            set({authUser: null});
        }finally{
            set({isCheckingAuth:false});
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");

            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }finally{
            set({ isSigningUp: false })
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            set({ authUser: res.data }); // Assuming `res.data` contains the user data
            toast.success("Logged in successfully");

            get().connectSocket();
        } catch (error) {
            // Check if error.response exists before accessing its properties
            if (error.response && error.response.data) {
                toast.error(error.response.data.message || "An error occurred during login.");
            } else {
                toast.error("Unable to connect to the server. Please try again later.");
            }
        } finally {
            set({ isLoggingIn: false });
        }
    },
    
    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("/auth/update-profile", data);
          set({ authUser: res.data });
          toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            const errorMessage = error.response?.data?.message || "An unexpected error occurred";
            toast.error(errorMessage);
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

    connectSocket: () => {
        const {authUser}=get()
        
        // hon aan n2ul iza l user msh connected aw iza l user already connected ma tekhla2le a new connection
        if(!authUser || get().socket?.connected) return;

        // when we call this function it will take some options li hie l userId (query bi alba userId which is bi aleb l socket hanshake.query.id)
        const socket = io(BASE_URL,{
            query: {
                userId: authUser._id,
            },
    });
        socket.connect();

        set({ socket:socket });

        //.on is used for listening w hettet "getOnlineUsers" l2n bl io.emit bl socket,js hatet hek
        socket.on("getOnlineUsers" ,(userIds) => {
            set({ onlineUsers: userIds })
        })

    },
    
    disconnectSocket: () => {
        //iza connected se3eta try to disconnect
        if(get().socket?.connected) get().socket.disconnect();
    },

    

}))
