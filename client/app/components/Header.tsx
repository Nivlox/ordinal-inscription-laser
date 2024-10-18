"use client";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Navbar, NavbarContent, NavbarItem } from "@nextui-org/react";
import { useLaserEyes, UNISAT } from "@omnisat/lasereyes";
import WalletConnectIcon from "./Icon/WalletConnectIcon";

const Header = () => {
    const {
        paymentAddress,
        connect,
        disconnect,
    } = useLaserEyes();


    return (
        <div className="p-10 px-16 ">
            <Navbar
                maxWidth="full"
            >
                <div className="flex relative">
                    <img width={"180px"} src="https://next-cdn.unisat.io/_/298/logo/logo_unisat.svg"></img>
                    <p className=" absolute text-3xl left-10 font-bold text-amber-600">Unisat</p>
                </div>
                <NavbarContent justify="end" className="gap-10">
                    <NavbarItem>
                        {!paymentAddress ?
                            <Button
                                color="warning"
                                variant="solid"
                                onPress={() => connect(UNISAT)}
                                className="capitalize bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg w-[200px] text-lg h-[45px]"
                            >
                                <WalletConnectIcon />

                                Connect Wallet
                            </Button> :
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        color="warning"
                                        variant="solid"
                                        className="capitalize bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg  w-[200px] text-lg h-[45px]"
                                    >
                                        <p className="truncate w-[160px]">{paymentAddress}</p>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Dynamic Actions" >
                                    <DropdownItem
                                        color="danger"
                                        className="text-danger text-center"
                                        onClick={disconnect}
                                        classNames={{
                                            wrapper: "text-xl"
                                        }}
                                    >
                                        Disconnect
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        }
                    </NavbarItem>
                </NavbarContent>
            </Navbar >

        </div >
    )
}
export default Header;