import React, { useCallback } from 'react';
import { MDBAnimation, MDBBtn, MDBInput } from 'mdbreact';
import { Col, Container, Form, Row } from 'reactstrap';

export default function Login({ setUser, setErrorMessage, errorMessage }) {
  const onSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const email = formData.get('email');
      const password = formData.get('password');
      const user = { email, password };
      setUser(user);
      setErrorMessage('');
    },
    [setErrorMessage, setUser]
  );

  return (
    <MDBAnimation type="fadeIn">
      <Container>
        <Row>
          <Col xs="auto" className="mx-auto mt-5">
            <Form onSubmit={onSubmit}>
              <MDBInput
                label="Email"
                type="email"
                name="email"
                outline
                validate
                required
              />
              <MDBInput
                label="Password"
                type="password"
                name="password"
                outline
                validate
                required
              />
              <div className="md-form">
                <span style={{ color: 'red' }}>{errorMessage}</span>
              </div>
              <MDBBtn className="mx-auto" type="submit" color="light" block>
                Login
              </MDBBtn>
            </Form>
          </Col>
        </Row>
      </Container>
    </MDBAnimation>
  );
}
