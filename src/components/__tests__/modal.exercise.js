// 🐨 you're gonna need this stuff:
import {Modal, ModalContents, ModalOpenButton} from '../modal'
import {render, screen, within} from '@testing-library/react'
import React from 'react'
import {Button} from '../../components/lib'
import userEvent from '@testing-library/user-event'

test('can be opened and closed', () => {
    const label='example_label';
    const title = 'title';

    const modal = <Modal>
    <ModalOpenButton>
      <Button variant="primary">Open</Button>
    </ModalOpenButton>
    <ModalContents aria-label={label} title={title}>test</ModalContents>
  </Modal>
  
  render(modal)
  userEvent.click(screen.getByRole('button', {name: /open/i}))
  const modalContent = screen.getByRole('dialog')
  expect(modalContent).toHaveAttribute('aria-label', label)
  const inModal = within(modalContent);
  expect(inModal.getByRole('heading', {name: title})).toBeInTheDocument()
  userEvent.click(inModal.getByRole('button', {name: /close/i}))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
