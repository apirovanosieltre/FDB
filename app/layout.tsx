import type {Metadata, Viewport} from 'next';
import PwaControls from './pwa-controls';
import './globals.css';
export const metadata:Metadata={title:'FDB-Birthday | Barbie Après-Ski · Pink 30s',description:'20–21 February 2027, Hotel Vallunga · Campo Tartano. A birthday in pink. Choose your experience.',robots:{index:false,follow:false},manifest:'/manifest.webmanifest',applicationName:'FDB-Birthday',appleWebApp:{capable:true,title:'FDB Birthday',statusBarStyle:'default'},icons:{icon:'/favicon.svg',apple:'/icons/apple-touch-icon.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#b83261',viewportFit:'cover'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<PwaControls/></body></html>}
