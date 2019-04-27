import CardFaceEnum from "./CardFaceEnum";

let map = new Map<CardFaceEnum, number>();

map.set(CardFaceEnum.ACE, 11);
map.set(CardFaceEnum.TEN, 10);
map.set(CardFaceEnum.KING, 4);
map.set(CardFaceEnum.OBER, 3);
map.set(CardFaceEnum.UNTER, 2);
map.set(CardFaceEnum.NINE, 0);
map.set(CardFaceEnum.EIGHT, 0);
map.set(CardFaceEnum.SEVEN, 0);

export default map;