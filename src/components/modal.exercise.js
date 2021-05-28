/** @jsx jsx */
import {jsx} from '@emotion/core'

import VisuallyHidden from '@reach/visually-hidden';
import React from 'react';
import { useContext, useState } from 'react';
import {CircleButton, Dialog} from './lib'

const callAll = (...fns) => (...args) => fns.forEach(fn => fn && fn(...args))
const ModalContext = React.createContext(null);

function Modal(props) {
  const [isOpen, setOpen] = useState(false);

  return <ModalContext.Provider value={{isOpen, setOpen}} {...props} />
}

function ModalDismissButton({children}) {
  const {setOpen} = useContext(ModalContext);

  return React.cloneElement(children, {
    onClick: callAll(() => setOpen(false), children.props.onClick),
  })
}

function ModalOpenButton({children}) {
  const {setOpen} = useContext(ModalContext);

  return React.cloneElement(children, {
    onClick: callAll(() => setOpen(true), children.props.onClick),
  })
}

function ModalContentsBase({children, ...props}) {
  const {isOpen, setIsOpen} = React.useContext(ModalContext)
  return (
    <Dialog isOpen={isOpen} onDismiss={() => setIsOpen(false)} {...props}>
      {children}
    </Dialog>
  )
}

function ModalContents({title, children, ...props}) {
  return <ModalContentsBase {...props}>
      <div css={{display: 'flex', justifyContent: 'flex-end'}}>
        <ModalDismissButton>
          <CircleButton>
            <VisuallyHidden>Close</VisuallyHidden>
            <span aria-hidden>×</span>
          </CircleButton>
        </ModalDismissButton>
      </div>
      <h3 css={{textAlign: 'center', fontSize: '2em'}}>{title}</h3>
    {children}
  </ModalContentsBase>
}

export {Modal, ModalDismissButton, ModalOpenButton, ModalContents}
