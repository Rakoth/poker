module Poker

  Ranks = {
            9 => :royal_flush,
            8 => :straight_flush,
            7 => :four_of_a_kind,
            6 => :full_house,
            5 => :flush,
            4 => :straight,
            3 => :three_of_a_kind,
            2 => :two_pairs,
            1 => :pair,
            0 => :empty,
          }
            
  Suits = {
    0 => "C",
    1 => "D",
    2 => "H",
    3 => "S",
  }
  
  Numbers = {
    2 => '2',
    3 => '3',
    4 => '4',
    5 => '5',
    6 => '6',
    7 => '7',
    8 => '8',
    9 => '9',
    10 => 'T',
    11 => 'J',
    12 => 'Q',
    13 => 'K',
    14 => 'A',
  }
  
  SortedDeck = Poker::Deck.new.sort

  TestHands = {
    :royal_flush     => Poker::Hand.new(SortedDeck[32], SortedDeck[36], SortedDeck[40], SortedDeck[44], SortedDeck[48]),
    :straight_flush  => Poker::Hand.new(SortedDeck[28], SortedDeck[32], SortedDeck[36], SortedDeck[40], SortedDeck[44]),
    :four_of_a_kind  => Poker::Hand.new(SortedDeck[32], SortedDeck[33], SortedDeck[34], SortedDeck[35], SortedDeck[48]),
    :full_house      => Poker::Hand.new(SortedDeck[32], SortedDeck[33], SortedDeck[34], SortedDeck[36], SortedDeck[37]),
    :flush           => Poker::Hand.new(SortedDeck[0],  SortedDeck[8],  SortedDeck[48], SortedDeck[24], SortedDeck[32]),
    :straight        => Poker::Hand.new(SortedDeck[15], SortedDeck[5],  SortedDeck[18], SortedDeck[0],  SortedDeck[11]),
    :three_of_a_kind => Poker::Hand.new(SortedDeck[0],  SortedDeck[2],  SortedDeck[3],  SortedDeck[10], SortedDeck[7]),
    :two_pairs       => Poker::Hand.new(SortedDeck[0],  SortedDeck[2],  SortedDeck[4],  SortedDeck[6],  SortedDeck[10]),
    :pair            => Poker::Hand.new(SortedDeck[0],  SortedDeck[2],  SortedDeck[12], SortedDeck[27], SortedDeck[38]),
    :empty           => Poker::Hand.new(SortedDeck[0],  SortedDeck[13], SortedDeck[19], SortedDeck[28], SortedDeck[49]),
  }
end
