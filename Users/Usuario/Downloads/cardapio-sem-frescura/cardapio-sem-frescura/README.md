# Cardápio Sem Frescura (somente visualização)

Site público que **só mostra o cardápio**: sem carrinho, sem pedido, sem login.
Lê os dados do **mesmo Supabase** do site de pedidos (`products` e `settings`), então tudo que o admin muda lá (preço, foto, descrição, disponível/indisponível, logo, endereço) aparece aqui sozinho.

## Rodar

```bash
npm install
cp .env.example .env     # use a MESMA URL e anon key do site de pedidos
npm run dev
```

Nenhuma alteração é necessária no banco: as tabelas já têm leitura pública e escrita só para admin.

## Publicar

`npm run build` gera a pasta `dist/` (Vercel, Netlify ou qualquer hospedagem estática).
Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do deploy.
Depois é só apontar um endereço para ele (ex.: `cardapio.seudominio.com`) e gerar o QR Code.

## Atualização

A página recarrega os dados ao voltar para a aba e a cada 1 minuto. Em um celular que deixou o cardápio aberto, as mudanças do admin aparecem em até 1 minuto.
