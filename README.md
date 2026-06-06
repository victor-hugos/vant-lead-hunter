# VANT Lead Hunter

MVP local para criar campanhas multi-nicho, cadastrar leads, gerar mensagens e acompanhar envio manual por e-mail ou WhatsApp.

## Como usar

Abra `index.html` no navegador.

O sistema salva os dados no `localStorage` do navegador e permite exportar/importar JSON.

## Fluxo

- Victor define nicho, local, objetivo e oferta.
- O sistema usa a oferta informada para montar a abordagem.
- O envio e feito manualmente.
- Para e-mail, use `admin@vant.business` como conta remetente no cliente de e-mail.

## Deploy

Projeto estatico. Pode ser publicado diretamente na Vercel sem build command.

## Supabase

1. Abra o SQL Editor do Supabase.
2. Execute `docs/supabase.sql`.
3. No app, preencha:
   - Supabase URL
   - Supabase anon key
4. Clique em `Conectar banco`.

Enquanto o banco nao estiver configurado, o app usa `localStorage` como fallback.

Observacao: as policies do MVP permitem leitura e escrita com a anon key. Isso e pratico para validar hoje, mas deve ser endurecido com login antes de uso publico pesado.
