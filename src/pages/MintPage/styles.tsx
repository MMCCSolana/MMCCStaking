import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { Button } from "@chakra-ui/button";
import { Input } from "@chakra-ui/react";

const buttonStyles = css`
  all: unset;
  background: #000;
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 20px;
  border-style: solid;
  border-width: 3px;
  border-color: #3f3f3f;
  cursor: pointer;
  width: 205px;
  min-height: 65px;
  display: flex;
  align-content: center;
  align-items: center;
  border-radius: 10px;
  justify-content: center !important;
  color: #bcb500;
  font-weight: bold;

  &:hover {
    background-color: #000;
    border-color: #3f3f3f;
    color: #bcb500bd;
  }
`;

export const StyledWalletMultiButton = styled(WalletMultiButton)`
  ${buttonStyles}
  color: #0f30f4;
  &:hover {
    color: #0f30f4d1;
  }
  i {
    display: none;
  }
`;

export const StyledButton = styled(Button)`
  ${buttonStyles}
`;

export const StyledInput = styled(Input)`
  all: unset;
  color: #ebff00;
  padding-top: 10px;
  padding-bottom: 10px;
  font-size: 20px;
  border-style: solid;
  border-width: 3px;
  border-color: #ebff00;
  width: 205px;
  font-weight: 400;
  padding-left: 10px;
  padding-right: 70px;

  ::placeholder {
    font-size: 16px;
  }

  &:hover,
  &:focus {
    outline: none;
    box-shadow: none;
    border-color: #ebff00;
  }
`;

export const MaxButton = styled(Button)`
  position: absolute;
  border-color: #ebff00;
  &:hover {
    color: #000;
    background-color: #ebff00;
  }
`;
