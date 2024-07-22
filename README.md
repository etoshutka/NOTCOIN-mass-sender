# jetton-mass-sender
В файле .env(нужно создать по .env.example) - мнемоника кошелька 

Весь функционал что нам нужен в srcipts :

1. deployContract -  
2. пересылаем нужное кол-во жетонов на контракт
3. sendFlag -  в начале указываем адрес задеплоенного контракта
4. sendStart - в начале указываем адрес задеплоенного контракта,
также меняем кол-во тон в зависимости от количества участников( берем с запасом 0.5 ТОН на человека, весь остаток контракт вернет после рассылки на адрес того кто деплоил его)


Перед этим не забываем заполнить transacrtion.json ( в этой же папке scripts ) адресами и нужным количеством жеттонов ( в пересчете что 1*10^9 = 1 жетон, то есть 1000000000 у нас будет равен одному жетону )

Скрипты описаны в порядке их запуска, перед sendStart лучше проверить что наш контракт принял жетоны и флаг. Так как в этом сообщении отсылаются комиссии.

Запуск скриптов :

npm i

npx blueprint build ( дважды , сначала JettonDistr , затем MassSender)

npx blueprint run —mainnet —mnemonic deployContract(тут название скрипта)
