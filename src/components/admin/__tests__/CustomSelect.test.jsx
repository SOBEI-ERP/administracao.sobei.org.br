import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomSelect from '../CustomSelect';

describe('CustomSelect Component', () => {
  const mockOptions = [
    { value: 'op1', label: 'Opção 1' },
    { value: 'op2', label: 'Opção 2' },
  ];
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renderiza com o valor padrão inicialmente', () => {
    render(
      <CustomSelect 
        value="" 
        onChange={mockOnChange} 
        options={mockOptions} 
        defaultOption="Selecione..." 
      />
    );
    
    // Deve mostrar o texto da opção padrão
    expect(screen.getByText('Selecione...')).toBeInTheDocument();
    // O dropdown de opções não deve estar visível inicialmente
    expect(screen.queryByText('Opção 1')).not.toBeInTheDocument();
  });

  test('abre o dropdown ao clicar no trigger e mostra as opções', () => {
    render(
      <CustomSelect 
        value="" 
        onChange={mockOnChange} 
        options={mockOptions} 
        defaultOption="Selecione..." 
      />
    );

    // Clica no trigger
    const trigger = screen.getByText('Selecione...');
    fireEvent.click(trigger);

    // Deve exibir as opções agora
    expect(screen.getByText('Opção 1')).toBeInTheDocument();
    expect(screen.getByText('Opção 2')).toBeInTheDocument();
  });

  test('chama onChange com o valor selecionado e fecha o dropdown', () => {
    render(
      <CustomSelect 
        value="" 
        onChange={mockOnChange} 
        options={mockOptions} 
        defaultOption="Selecione..." 
      />
    );

    // Abre o dropdown
    fireEvent.click(screen.getByText('Selecione...'));

    // Clica em uma opção
    const option1 = screen.getByText('Opção 1');
    fireEvent.click(option1);

    // Deve chamar onChange com o valor correto
    expect(mockOnChange).toHaveBeenCalledWith('op1');
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    // Dropdown deve fechar
    expect(screen.queryByText('Opção 1')).not.toBeInTheDocument();
  });

  test('chama onChange com string vazia ao selecionar a opção padrão no dropdown', () => {
    render(
      <CustomSelect 
        value="op2" 
        onChange={mockOnChange} 
        options={mockOptions} 
        defaultOption="Selecione..." 
      />
    );

    // Abre o dropdown (o trigger exibe "Opção 2" pois é o valor selecionado)
    fireEvent.click(screen.getByText('Opção 2'));

    // Clica na opção padrão (defaultOption) que agora aparece listada no dropdown
    const defaultOptInDropdown = screen.getByText('Selecione...');
    fireEvent.click(defaultOptInDropdown);

    // Deve invocar onChange com string vazia
    expect(mockOnChange).toHaveBeenCalledWith('');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });
});
