class CreateGames < ActiveRecord::Migration
  def self.up
    create_table :games do |t|
      t.string :status, :default => 'wait'
      t.integer :turn, :default => 0 # id игрока, от которого ожидается действие
      t.integer :blind_position, :default => 0
      t.integer :blind_size
      t.integer :blind_level, :default => 0
      t.integer :ante, :default => 0
      t.integer :current_bet, :default => nil
      t.datetime :next_level_time
      t.integer :players_count, :default => 0
      t.integer :bank, :default => 0
      t.references :type

      t.timestamps
    end
  end

  def self.down
    drop_table :games
  end
end
