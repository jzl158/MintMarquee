import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/router";
import NProgress from "nprogress";
import { useSession, signOut } from "next-auth/react";

import { useCartContext } from "../context/CartContext";
import Cart from "./Cart";
const CartSidebar = dynamic(() => import("./CartSidebar"));

import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false });

export default function Nav() {
  const {
    setCartVisibility,
    clearCart,
    visible,
  } = useCartContext();
  const { data: session, status } = useSession()
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [avatarURL, setAvatarURL] = useState("");

  useEffect(() => {
    router.events.on("routeChangeStart", () => {
      NProgress.start();
    })

    router.events.on("routeChangeComplete", () => {
      NProgress.done();
    })

    router.events.on("routeChangeError", () => {
      NProgress.done();
    })
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      setUsername(session.user.name);
      setAvatarURL(session.user.image);
    }
  }, [status])

  function logout() {
    signOut();
    setUsername(null);
    setAvatarURL(null);
    clearCart();
    router.push("/");
  }

  return (
    <div className={`fixed w-100 ph3 pv3 pv3-ns ph3-m ph4-l fixed z-9999`}>
      <header>
        <nav className="f6 fw6 ttu tracked dt-l w-100 center">
          <div className="w-100 w-30-l dtc-l tc tl-l v-mid">
            <Link href="/">
              <a className="link dim dib" title="Home">
                <Image
                  src="/images/MMweblogo.png"
                  alt="MintMarquee Logo"
                  width={225}
                  height={75}
                  objectFit="contain"
                  priority
                />
              </a>
            </Link>
          </div>
          <div className="w-100 w-70-l dtc-l tc tr-l v-mid">
            <Link href="/store">
              <a
                className={`link dim dib mr3 v-mid ${router.pathname === "/store" ? "bb" : ""
                  }`}
                style={{ color: '#01693e' }}
                title="Store"
              >
                Store
              </a>
            </Link>
            <Link href="/about">
              <a
                className={`link dim dib mr3 v-mid ${router.pathname === "/about" ? "bb" : ""
                  }`}
                style={{ color: '#01693e' }}
                title="About"
              >
                About
              </a>
            </Link>
            <a
              className="link dim dib mr3 v-mid"
              style={{ color: '#01693e' }}
              href="https://github.com/vercel/vrs"
              target="_blank"
              title="GitHub"
            >
              GitHub
            </a>
            <a
              className="link dim dib mr3 v-mid"
              style={{ color: '#01693e' }}
              href="#"
              onClick={e => {
                e.preventDefault();
                console.log("opening cart...");
                setCartVisibility(true);
              }}
              title="Open Cart"
            >
              <Cart>
                <i className="material-icons md-18" style={{ color: '#01693e' }}>shopping_cart</i>
              </Cart>
            </a>
            {avatarURL ? (
              <div className="link dim dib v-mid">
                <Image
                  onClick={logout}
                  height={20}
                  width={20}
                  src={avatarURL}
                />
              </div>
            ) : (
              <Link href="/login">
                <a
                  className={`link dim dib v-mid ${router.pathname === "/login" ? "bb" : ""
                    }`}
                  style={{ color: '#01693e' }}
                  title="Login"
                >
                  <i className="material-icons md-18" style={{ color: '#01693e' }}>person</i>
                </a>
              </Link>
            )}
          </div>
        </nav>
      </header>
      {visible && <CartSidebar />}
    </div>
  );
}
