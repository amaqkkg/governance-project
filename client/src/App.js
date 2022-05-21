import "./App.css";
import { useState, useRef, useEffect } from "react";
import { providers, Contract } from "ethers";
import Web3Modal from "web3modal";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";

import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import moment from "moment";
import {
    NFT_CONTRACT_ADDRESS,
    nftabi,
    VOTE_CONTRACT_ADDRESS,
    voteabi,
} from "./constants/constants";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { styled } from "@mui/material/styles";

const defaultValues = {
    name: "",
    birthLocation: "",
    currentLocation: "",
    birthday: "2017-05-24",
};

const defaultProposalValues = {
    title: "",
    description: "",
    location: "",
    // deadline: "2022-05-30",
};

const CssTextField = styled(TextField)({
    "& label.Mui-focused": {
        color: "#e6aaae",
    },
    "& .MuiInput-underline:after": {
        borderBottomColor: "#e6aaae",
    },
    "& .MuiInputLabel-root": {
        color: "#e6aaae",
    },
    "& .MuiInputBase-input": {
        color: "#e6aaae",
    },
    "& .MuiOutlinedInput-root": {
        "& fieldset": {
            borderColor: "#e6aaae",
        },
        "&:hover fieldset": {
            borderColor: "#e6aaae",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#e6aaae",
        },
    },
});

const App = () => {
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [nftLoading, setNftLoading] = useState(false);
    const [createProposalLoading, setCreateProposalLoading] = useState(false);
    const [nftBalance, setNftBalance] = useState(0);
    const [numProposals, setNumProposals] = useState("0");
    const [proposals, setProposals] = useState([]);

    const [value, setValue] = useState("1");

    const [formValues, setFormValues] = useState(defaultValues);
    const [proposalFormValues, setProposalFormValues] = useState(
        defaultProposalValues
    );
    const [deadlineTime, setDeadlineTime] = useState(
        new Date("2018-01-01T00:00:00.000Z")
    );

    const handleTabChange = (event, newValue) => {
        setValue(newValue);
    };

    const web3ModalRef = useRef();
    const getProviderOrSigner = async (needSigner = false) => {
        //connect to metamask
        const provider = await web3ModalRef.current.connect();
        //wrap the provider with web3Provider
        const web3Provider = new providers.Web3Provider(provider);
        //check if the user is connected to rinkeby
        setWalletAddress(web3Provider.provider.selectedAddress);
        const { chainId } = await web3Provider.getNetwork();
        if (chainId !== 80001) {
            window.alert("Change the network to matic");
            // throw an error so that the code doesn't run further
            throw new Error("Change the network to matic");
        }

        //if the signer is true
        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }

        //return provider
        return web3Provider;
    };

    const connectWallet = async () => {
        try {
            await getProviderOrSigner();
            setWalletConnected(true);
        } catch (error) {
            console.error(error);
        }
    };

    const getUserNFTBalance = async () => {
        try {
            const signer = await getProviderOrSigner(true);
            const nftContract = new Contract(
                NFT_CONTRACT_ADDRESS,
                nftabi,
                signer
            );
            const balance = await nftContract.balanceOf(signer.getAddress());
            console.log(parseInt(balance.toString()));
            setNftBalance(parseInt(balance.toString()));
        } catch (error) {
            console.error(error);
        }
    };

    const getNumProposalsInDAO = async () => {
        try {
            const provider = await getProviderOrSigner();
            const votecontract = new Contract(
                VOTE_CONTRACT_ADDRESS,
                voteabi,
                provider
            );
            const numOfProposals = await votecontract.numProposals();
            console.log("numOfProposals", numOfProposals.toString());
            setNumProposals(numOfProposals.toString());
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: "rinkeby",
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet().then(() => {
                getUserNFTBalance();
                getNumProposalsInDAO();
            });
        }
    }, [walletConnected]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(value);
        setFormValues({
            ...formValues,
            [name]: value,
        });
    };

    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        console.log(value);
        setProposalFormValues({
            ...proposalFormValues,
            [name]: value,
        });
    };

    const createProposal = async (event) => {
        event.preventDefault();
        console.log(moment.unix(deadlineTime)._i);
        console.log("proposalFormValues", proposalFormValues);
        try {
            const signer = await getProviderOrSigner(true);
            const voteContract = new Contract(
                VOTE_CONTRACT_ADDRESS,
                voteabi,
                signer
            );
            const txn = await voteContract.createProposal(
                proposalFormValues.title,
                proposalFormValues.description,
                proposalFormValues.location,
                moment.unix(deadlineTime)._i
            );
            setCreateProposalLoading(true);
            await txn.wait();
            await getNumProposalsInDAO();
            setCreateProposalLoading(false);
            window.alert("You successfully created a proposal");

            setProposalFormValues(defaultProposalValues);
        } catch (error) {
            console.error(error);
            window.alert(error.message);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            console.log(formValues.birthday);
            formValues.birthday = moment(
                formValues.birthday,
                "YYYY.MM.DD"
            ).unix();
            console.log("birthDate", formValues.birthday);

            console.log(formValues);
            const signer = await getProviderOrSigner(true);
            const nftContract = new Contract(
                NFT_CONTRACT_ADDRESS,
                nftabi,
                signer
            );
            const tx = await nftContract.mint(
                walletAddress,
                formValues.name,
                formValues.birthLocation,
                formValues.currentLocation,
                formValues.birthday
            );
            setNftLoading(true);
            // wait for the transaction to get mined
            await tx.wait();
            setNftLoading(false);
            window.alert("You successfully minted a BirthCertificate NFT!");

            setFormValues(defaultValues);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="App">
            <div className="navbar__container">
                <h2 className="website__title">State Management DAO</h2>
                {walletConnected ? (
                    <Button
                        style={{ color: "#000", background: "#e6aaae" }}
                        className="connect__btn"
                    >
                        {walletAddress.slice(0, 2)}...{walletAddress.slice(-3)}
                    </Button>
                ) : (
                    <Button
                        style={{ color: "#000", background: "#e6aaae" }}
                        className="connect__btn"
                        onClick={connectWallet}
                    >
                        Connect your wallet
                    </Button>
                )}
            </div>

            <div className="main__container">
                <Box sx={{ width: "100%", typography: "body1" }}>
                    <TabContext value={value}>
                        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                            <TabList
                                onChange={handleTabChange}
                                aria-label="lab API tabs example"
                            >
                                <Tab
                                    style={{ color: "#e6aaae" }}
                                    label="Mint NFT"
                                    value="1"
                                />
                                <Tab
                                    style={{ color: "#e6aaae" }}
                                    label="Create Proposal"
                                    value="2"
                                />
                                <Tab
                                    style={{ color: "#e6aaae" }}
                                    label="Vote on Proposal"
                                    value="3"
                                />
                            </TabList>
                        </Box>
                        <TabPanel value="1">
                            <form
                                // onSubmit={handleSubmit}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Grid
                                    container
                                    alignItems="center"
                                    justify="center"
                                    direction="column"
                                >
                                    <Stack
                                        component="form"
                                        sx={{
                                            width: "35ch",
                                        }}
                                        spacing={2}
                                        noValidate
                                        autoComplete="off"
                                    >
                                        <Grid item>
                                            <CssTextField
                                                id="name-input"
                                                name="name"
                                                label="Name"
                                                type="text"
                                                fullWidth
                                                value={formValues.name}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item>
                                            <CssTextField
                                                id="birth-location"
                                                name="birthLocation"
                                                label="Birth Location"
                                                fullWidth
                                                type="text"
                                                value={formValues.birthLocation}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item>
                                            <CssTextField
                                                id="current-location"
                                                name="currentLocation"
                                                label="Current Location"
                                                type="text"
                                                fullWidth
                                                value={
                                                    formValues.currentLocation
                                                }
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item>
                                            <CssTextField
                                                id="date"
                                                label="Birthday"
                                                name="birthday"
                                                type="date"
                                                fullWidth
                                                value={formValues.birthday}
                                                onChange={handleInputChange}
                                                sx={{ width: 220 }}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </Grid>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            type="submit"
                                            onClick={handleSubmit}
                                        >
                                            Submit
                                        </Button>
                                    </Stack>
                                </Grid>
                            </form>
                        </TabPanel>
                        <TabPanel value="2">
                            {nftBalance === 0 ? (
                                <div>
                                    You do not own any BirthCertificateNFT.{" "}
                                    <br />
                                    <b>
                                        You cannot create or vote on proposals.
                                    </b>
                                </div>
                            ) : (
                                <form
                                    // onSubmit={handleSubmit}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Grid
                                        container
                                        alignItems="center"
                                        justify="center"
                                        direction="column"
                                    >
                                        <Stack
                                            component="form"
                                            sx={{
                                                width: "35ch",
                                            }}
                                            spacing={2}
                                            noValidate
                                            autoComplete="off"
                                        >
                                            <Grid item>
                                                <CssTextField
                                                    id="title-input"
                                                    name="title"
                                                    label="title"
                                                    type="text"
                                                    fullWidth
                                                    value={
                                                        proposalFormValues.title
                                                    }
                                                    onChange={
                                                        handleCreateInputChange
                                                    }
                                                />
                                            </Grid>
                                            <Grid item>
                                                <CssTextField
                                                    id="desc-input"
                                                    name="description"
                                                    label="description"
                                                    type="text"
                                                    fullWidth
                                                    value={
                                                        proposalFormValues.description
                                                    }
                                                    onChange={
                                                        handleCreateInputChange
                                                    }
                                                />
                                            </Grid>
                                            <Grid item>
                                                <CssTextField
                                                    id="location-input"
                                                    name="location"
                                                    label="location"
                                                    type="text"
                                                    fullWidth
                                                    value={
                                                        proposalFormValues.location
                                                    }
                                                    onChange={
                                                        handleCreateInputChange
                                                    }
                                                />
                                            </Grid>
                                            <Grid item>
                                                <LocalizationProvider
                                                    dateAdapter={AdapterDateFns}
                                                >
                                                    <DateTimePicker
                                                        label="Responsive"
                                                        renderInput={(
                                                            params
                                                        ) => (
                                                            <TextField
                                                                {...params}
                                                            />
                                                        )}
                                                        value={deadlineTime}
                                                        onChange={(
                                                            newValue
                                                        ) => {
                                                            setDeadlineTime(
                                                                newValue
                                                            );
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                                {/* <CssTextField
                                                    id="date"
                                                    label="Deadline"
                                                    name="deadline"
                                                    type="date"
                                                    fullWidth
                                                    value={
                                                        proposalFormValues.deadline
                                                    }
                                                    onChange={
                                                        handleCreateInputChange
                                                    }
                                                    sx={{ width: 220 }}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                /> */}
                                            </Grid>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                type="submit"
                                                onClick={createProposal}
                                            >
                                                Submit
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </form>
                            )}
                        </TabPanel>
                        <TabPanel value="3">
                            {proposals.length === 0 ? (
                                <div>No proposals have been created</div>
                            ) : (
                                <div></div>
                            )}
                        </TabPanel>
                    </TabContext>
                </Box>
            </div>
        </div>
    );
};

export default App;
