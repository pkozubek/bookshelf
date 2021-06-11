// 🐨 you'll want a fake user to register as:
import {buildUser} from '../support/generate'

describe('smoke', () => {
  it('should allow a typical user flow', () => {
    const user = buildUser();
    cy.visit('/')

    cy.findByRole('button', {name: /register/i}).click()
    
    cy.findByRole('dialog').within(() => {
      cy.findByRole('textbox', {name: /username/i}).type(user.username)
      cy.findByLabelText(/password/i).type(user.password)
      cy.findByRole('button', {name: /register/i}).click()
    })


    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /discover/i}).click()
    })

    cy.findByRole('main').within(() => {
      cy.findByRole('searchbox', {name: /search/i}).type('the lord of the rings{enter}')
      cy.findByRole('listitem', {name: /the lord of the rings/i}).within(() => {
        cy.findAllByRole('button', {name: /add to list/i}).click()
      })
    })

    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /reading list/i}).click()
    })

    cy.findAllByRole('main').within(() => {
      cy.findAllByRole('listitem').should('have.length', 1)
      cy.findByRole('listitem', {name: /the lord of the rings/i}).click()
    })

    const note = 'aaa';
    cy.findAllByRole('textbox', {name: /notes/i}).type(`${note}{enter}`)
    cy.findByLabelText(/loading/i).should('exist')
    cy.findByLabelText(/loading/i).should('not.exist')

    cy.findByRole('button', {name: /mark as read/i}).click()
    cy.findByRole('radio', {name: /5 stars/i}).click({force: true})

    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /finished books/i}).click()
    })

    cy.findAllByRole('main').within(() => {
      cy.findAllByRole('listitem').should('have.length', 1)
      cy.findByRole('listitem', {name: /the lord of the rings/i}).within(() => {
        cy.findByRole('radio', {name: /5 stars/i}).should('be.checked')
      })
      cy.findByRole('listitem', {name: /the lord of the rings/i}).click()
    })

    cy.findByRole('button', {name: /remove from list/i}).click()
    cy.findByRole('textbox', 'textbox', {name: /notes/i}).should('not.exist')
    cy.findAllByRole('radio').should('have.length', 0)

    cy.findByRole('navigation').within(() => {
      cy.findByRole('link', {name: /finished books/i}).click()
    })

    cy.findAllByRole('main').within(() => {
      cy.findAllByRole('listitem').should('have.length', 0)
    })
  })
})
